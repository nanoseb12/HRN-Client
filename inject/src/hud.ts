import { createButton } from "./utils";
import { COMPETITION_LOGOS } from "./scoreboardLogos";
import { applyRacingThemeTokens, DASHBOARD_THEMES, DASHBOARD_STYLE_LABELS, DashboardStyle, ScoreboardStyle } from "./racingTheme";

type OverlayPosition = "default" | "top-left" | "bottom-left" | "bottom-center" | "bottom-right" | "top-right";
type KeyLayout = "wasd" | "arrows";
type HudConfig = {
    showLastLap: boolean;
    showLapCount: boolean;
    showSpeed: boolean;
    showGear: boolean;
    speedMultiplier: number;
    maxSpeedKmh: number;
    gearPercentages: number[];
    dashboardStyle: DashboardStyle;
    scoreboardStyle: ScoreboardStyle;
    scoreboardPosition: OverlayPosition;
    showKeyIndicator: boolean;
    keyLayout: KeyLayout;
    keyPosition: OverlayPosition;
    left: number;
    top: number;
};
type HudVehiclePreset = {
    id: string;
    name: string;
    percentages: number[];
    maxSpeedKmh: number;
    speedMultiplier: number;
};

const DEFAULT_CONFIG: HudConfig = {
    showLastLap: true,
    showLapCount: true,
    showSpeed: true,
    showGear: true,
    speedMultiplier: 1,
    maxSpeedKmh: 300,
    gearPercentages: [18, 35, 53, 72, 88, 100],
    dashboardStyle: "normal",
    scoreboardStyle: "haxball",
    scoreboardPosition: "default",
    showKeyIndicator: true,
    keyLayout: "wasd",
    keyPosition: "default",
    left: 24,
    top: 72,
};
let speedPoller: number | null = null;
let readCanvasSpeed: () => number | null = () => null;
const hookedCanvasPrototypes = new WeakSet<object>();
const originalScoreboardStyles = new WeakMap<HTMLElement, string>();
const SCOREBOARD_STYLE_LABELS: Record<ScoreboardStyle, string> = {
    haxball: "Haxball Racing Series",
    f1: "F1",
    "f1-vintage": "F1 Vintage",
    wec: "WEC",
    "porsche-cup": "Porsche Cup",
};
const POSITION_LABELS: Record<OverlayPosition, string> = {
    default: "Predeterminada",
    "top-left": "Arriba a la izquierda",
    "bottom-left": "Abajo a la izquierda",
    "bottom-center": "Abajo al centro",
    "bottom-right": "Abajo a la derecha",
    "top-right": "Arriba a la derecha",
};
const SCOREBOARD_THEMES: Record<ScoreboardStyle, { accent: string; background: string; border: string; color: string; font: string; logo: keyof typeof COMPETITION_LOGOS }> = {
    haxball: { accent: "#5be1d0", background: "#111a1d", border: "#d9a95b", color: "#f7f4ea", font: "Arial,sans-serif", logo: "haxball" },
    f1: { accent: "#ed1c24", background: "#111", border: "#ed1c24", color: "#fff", font: "'Arial Black',Impact,sans-serif", logo: "f1" },
    "f1-vintage": { accent: "#d62828", background: "#171717", border: "#a5a5a5", color: "#f7f3e8", font: "'Arial Black',Impact,sans-serif", logo: "f1Vintage" },
    wec: { accent: "#a4d65e", background: "#101b2c", border: "#1d5b9e", color: "#f4f7fb", font: "'Arial Narrow','Roboto Condensed',Arial,sans-serif", logo: "wec" },
    "porsche-cup": { accent: "#b3213b", background: "#17181b", border: "#9da1a6", color: "#f6f3f2", font: "'Arial Narrow',Arial,sans-serif", logo: "porscheCup" },
};
const getCombinedScoreboardTheme = (config: HudConfig) => {
    const competition = SCOREBOARD_THEMES[config.scoreboardStyle];
    const dashboard = DASHBOARD_THEMES[config.dashboardStyle];
    return { ...competition, accent: dashboard.accent, border: dashboard.border, background: dashboard.background };
};
const SCOREBOARD_POSITION_LABELS: Record<OverlayPosition, string> = {
    ...POSITION_LABELS,
    default: "Original de HaxBall (centro arriba)",
};
const KEY_POSITION_LABELS: Record<OverlayPosition, string> = {
    ...POSITION_LABELS,
    default: "Predeterminada (arriba a la izquierda)",
};
const findScoreboard = (doc: Document): HTMLElement | null =>
    doc.querySelector<HTMLElement>(".game-state-view .bar > .scoreboard")
    || doc.querySelector<HTMLElement>(".game-state-view .scoreboard")
    || doc.querySelector<HTMLElement>(".scoreboard");

const readGameTimerSeconds = (doc: Document): number | null => {
    // HaxBall renders the clock in its own .game-timer-view beside the score.
    // Its digits are separate child nodes, so read textContent to join them.
    const timerView = doc.querySelector<HTMLElement>(".game-timer-view");
    if (!timerView) return null;
    const timer = (timerView.textContent || "").replace(/\s+/g, "").match(/(\d{1,2}):([0-5]\d)/);
    if (!timer) return null;
    const minutes = Number(timer[1]);
    const seconds = Number(timer[2]);
    return minutes * 60 + seconds;
};

const readBallPosition = (gameframe: HTMLIFrameElement): { x: number; y: number } | null => {
    const contexts = [window, gameframe.contentWindow, gameframe.contentWindow?.parent].filter(Boolean) as Window[];
    for (const context of contexts) {
        const bridge = (context as any).g;
        try {
            const ball = typeof bridge?.getBallPosition === "function"
                ? bridge.getBallPosition()
                : typeof bridge?.getDiscProperties === "function" ? bridge.getDiscProperties(0) : null;
            if (Number.isFinite(ball?.x) && Number.isFinite(ball?.y)) return { x: ball.x, y: ball.y };
        } catch { /* The game bridge is not always ready during room transitions. */ }
    }
    return null;
};

const createStartLights = (doc: Document, gameframe: HTMLIFrameElement, config: HudConfig): { update: () => void } => {
    const theme = getCombinedScoreboardTheme(config);
    const root = doc.createElement("section");
    root.id = "haxracing-start-lights";
    root.setAttribute("aria-live", "polite");
    root.style.cssText = `position:fixed;top:40px;left:50%;transform:translateX(-50%);z-index:10002;display:flex;align-items:center;gap:10px;padding:7px 11px;border:1px solid ${theme.border};border-radius:7px;background:#111619f2;box-shadow:0 5px 18px #0009;color:#dfe8e5;font:700 10px/1.2 ${theme.font};letter-spacing:.08em;pointer-events:none;user-select:none;transition:opacity .2s ease;`;
    const message = doc.createElement("span");
    message.dataset.startLightsMessage = "true";
    message.textContent = "ESPERANDO SALIDA";
    const lamps = doc.createElement("div");
    lamps.style.cssText = "display:flex;gap:5px;padding:5px 7px;border-radius:12px;background:#080b0d;border:1px solid #343b3d;";
    const bulbs: HTMLElement[] = [];
    for (let index = 0; index < 5; index++) {
        const bulb = doc.createElement("span");
        bulb.style.cssText = "width:12px;height:12px;border-radius:50%;background:#4a171b;border:1px solid #5b292d;box-shadow:inset 0 1px 2px #0008;";
        lamps.appendChild(bulb);
        bulbs.push(bulb);
    }
    root.append(message, lamps);
    doc.body.appendChild(root);

    let phase: "ready" | "green" | "off" = "ready";
    let greenUntil = 0;
    let previousTimer = readGameTimerSeconds(doc);
    let previousBallPosition = readBallPosition(gameframe);
    if (previousTimer !== null && previousTimer > 0) {
        phase = "off";
        root.style.display = "none";
    }
    const render = (): void => {
        root.style.display = phase === "off" ? "none" : "flex";
        const isGreen = phase === "green";
        message.textContent = isGreen ? "¡SALIDA!" : "ESPERANDO SALIDA";
        message.style.color = isGreen ? "#6dff9b" : "#ff6672";
        bulbs.forEach(bulb => {
            bulb.style.background = isGreen ? "#24e66b" : "#ec3443";
            bulb.style.borderColor = isGreen ? "#76ff9e" : "#ff8a91";
            bulb.style.boxShadow = isGreen ? "0 0 10px #24e66bcc" : "0 0 9px #ec344388";
        });
    };
    render();

    return {
        update: () => {
            const timer = readGameTimerSeconds(doc);
            const ballPosition = readBallPosition(gameframe);
            const ballMoved = !!ballPosition && !!previousBallPosition
                && Math.hypot(ballPosition.x - previousBallPosition.x, ballPosition.y - previousBallPosition.y) > 2;
            const timerStarted = timer !== null && previousTimer !== null && timer !== previousTimer;
            const timerAppearedRunning = timer !== null && previousTimer === null && timer > 0;

            if (phase === "off" && timer === 0 && previousTimer !== null && previousTimer > 0) {
                phase = "ready";
                render();
            } else if (phase === "ready" && (timerStarted || timerAppearedRunning || ballMoved)) {
                phase = "green";
                greenUntil = performance.now() + 5000;
                render();
            } else if (phase === "green" && performance.now() >= greenUntil) {
                phase = "off";
                render();
            }

            previousTimer = timer;
            previousBallPosition = ballPosition || previousBallPosition;
        },
    };
};

let removeKeyListeners: (() => void) | null = null;

const createKeyIndicator = (doc: Document, config: HudConfig): HTMLElement | null => {
    if (!config.showKeyIndicator) return null;
    const theme = getCombinedScoreboardTheme(config);
    const root = doc.createElement("div");
    root.id = "haxracing-key-indicator";
    root.setAttribute("aria-label", "Teclas de conducción");
    root.style.cssText = `position:fixed;z-index:10000;display:grid;grid-template-columns:repeat(3,38px);grid-template-rows:repeat(2,38px);gap:5px;padding:8px;border:1px solid ${theme.border};border-radius:7px;background:#111a1de8;box-shadow:0 5px 18px #0008;pointer-events:none;user-select:none;`;
    const positionStyles: Record<OverlayPosition, string> = {
        default: "top:68px;left:12px;",
        "top-left": "top:12px;left:12px;",
        "bottom-left": "bottom:12px;left:12px;",
        "bottom-center": "bottom:12px;left:50%;transform:translateX(-50%);",
        "bottom-right": "bottom:12px;right:12px;",
        "top-right": "top:12px;right:12px;",
    };
    root.style.cssText += positionStyles[config.keyPosition];
    const keys = config.keyLayout === "wasd"
        ? [{ direction: "up", label: "W", row: 1, column: 2 }, { direction: "left", label: "A", row: 2, column: 1 }, { direction: "down", label: "S", row: 2, column: 2 }, { direction: "right", label: "D", row: 2, column: 3 }]
        : [{ direction: "up", label: "↑", row: 1, column: 2 }, { direction: "left", label: "←", row: 2, column: 1 }, { direction: "down", label: "↓", row: 2, column: 2 }, { direction: "right", label: "→", row: 2, column: 3 }];
    const pressed = new Set<string>();
    const caps = new Map<string, HTMLElement>();
    keys.forEach(key => {
        const cap = doc.createElement("div");
        cap.dataset.keyDirection = key.direction;
        cap.textContent = key.label;
        cap.style.cssText = `grid-row:${key.row};grid-column:${key.column};display:flex;align-items:center;justify-content:center;border:1px solid #536367;border-radius:5px;background:#202d31;color:#dce6e3;font:700 16px/1 Arial,sans-serif;transition:background .06s,color .06s,box-shadow .06s;`;
        root.appendChild(cap);
        caps.set(key.direction, cap);
    });
    const renderPressed = (): void => {
        caps.forEach((cap, direction) => {
            const active = pressed.has(direction);
            cap.style.background = active ? theme.accent : "#202d31";
            cap.style.color = active ? "#111a1d" : "#dce6e3";
            cap.style.borderColor = active ? theme.accent : "#536367";
            cap.style.boxShadow = active ? `0 0 10px ${theme.accent}99` : "none";
        });
    };
    const keyDirections: Record<string, string> = {
        w: "up", arrowup: "up", a: "left", arrowleft: "left",
        s: "down", arrowdown: "down", d: "right", arrowright: "right",
    };
    const isEditableTarget = (target: EventTarget | null): boolean => {
        const element = target as HTMLElement | null;
        return !!element && (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));
    };
    const onKeyDown = (event: KeyboardEvent): void => {
        if (isEditableTarget(event.target)) return;
        const direction = keyDirections[event.key.toLowerCase()];
        if (direction && !pressed.has(direction)) { pressed.add(direction); renderPressed(); }
    };
    const onKeyUp = (event: KeyboardEvent): void => {
        const direction = keyDirections[event.key.toLowerCase()];
        if (direction && pressed.delete(direction)) renderPressed();
    };
    const clearPressed = (): void => { pressed.clear(); renderPressed(); };
    doc.addEventListener("keydown", onKeyDown, true);
    doc.addEventListener("keyup", onKeyUp, true);
    doc.defaultView?.addEventListener("blur", clearPressed);
    removeKeyListeners = () => {
        doc.removeEventListener("keydown", onKeyDown, true);
        doc.removeEventListener("keyup", onKeyUp, true);
        doc.defaultView?.removeEventListener("blur", clearPressed);
        removeKeyListeners = null;
    };
    return root;
};

const avoidOverlayCollisions = (doc: Document, config: HudConfig): void => {
    const keyIndicator = doc.getElementById("haxracing-key-indicator") as HTMLElement | null;
    if (!keyIndicator) return;
    const view = doc.defaultView;
    if (!view) return;
    const width = view.innerWidth;
    const height = view.innerHeight;
    const keyWidth = keyIndicator.offsetWidth;
    const keyHeight = keyIndicator.offsetHeight;
    const base: Record<OverlayPosition, { left: number; top: number }> = {
        default: { left: 12, top: 68 },
        "top-left": { left: 12, top: 12 },
        "bottom-left": { left: 12, top: height - keyHeight - 12 },
        "bottom-center": { left: (width - keyWidth) / 2, top: height - keyHeight - 12 },
        "bottom-right": { left: width - keyWidth - 12, top: height - keyHeight - 12 },
        "top-right": { left: width - keyWidth - 12, top: 12 },
    };
    const blockers = [
        doc.querySelector<HTMLElement>(".chatbox-view-contents"),
        doc.getElementById("haxracing-hud"),
        findScoreboard(doc),
        doc.querySelector<HTMLElement>(".game-timer-view"),
        doc.querySelector<HTMLElement>(".game-view>.buttons"),
        doc.querySelector<HTMLElement>(".sound-button-container"),
        doc.getElementById("haxracing-start-lights"),
    ].filter((element): element is HTMLElement => !!element && element.getClientRects().length > 0
        && view.getComputedStyle(element).display !== "none" && view.getComputedStyle(element).visibility !== "hidden");
    const collides = (left: number, top: number): boolean => blockers.some(element => {
        const rect = element.getBoundingClientRect();
        return left < rect.right + 8 && left + keyWidth > rect.left - 8
            && top < rect.bottom + 8 && top + keyHeight > rect.top - 8;
    });
    const starting = base[config.keyPosition];
    let left = starting.left;
    let top = starting.top;
    if (collides(left, top)) {
        const chat = blockers.find(element => element.classList.contains("chatbox-view-contents"));
        const chatRect = chat?.getBoundingClientRect();
        const candidates = [
            ...(chatRect ? [{ left: (width - keyWidth) / 2, top: chatRect.top - keyHeight - 12 }] : []),
            { left: 12, top: 12 },
            { left: width - keyWidth - 12, top: 12 },
            { left: 12, top: height - keyHeight - 12 },
            { left: width - keyWidth - 12, top: height - keyHeight - 12 },
            { left: 12, top: height / 2 - keyHeight / 2 },
            { left: width - keyWidth - 12, top: height / 2 - keyHeight / 2 },
        ].map(point => ({ left: Math.max(8, Math.min(width - keyWidth - 8, point.left)), top: Math.max(8, Math.min(height - keyHeight - 8, point.top)) }));
        const clearCandidate = candidates.find(point => !collides(point.left, point.top));
        if (clearCandidate) ({ left, top } = clearCandidate);
    }
    keyIndicator.style.left = `${left}px`;
    keyIndicator.style.top = `${top}px`;
    keyIndicator.style.right = "auto";
    keyIndicator.style.bottom = "auto";
    keyIndicator.style.transform = "none";
};

const applyScoreboardAppearance = (doc: Document, config: HudConfig): void => {
    const scoreboard = findScoreboard(doc);
    if (!scoreboard) return;
    if (!originalScoreboardStyles.has(scoreboard)) originalScoreboardStyles.set(scoreboard, scoreboard.style.cssText);

    const theme = getCombinedScoreboardTheme(config);
    const previousLayout = scoreboard.dataset.haxracingLayout;
    const layout = `${config.dashboardStyle}:${config.scoreboardStyle}:${config.scoreboardPosition}`;
    if (previousLayout === layout) return;
    scoreboard.style.cssText = originalScoreboardStyles.get(scoreboard) || "";
    scoreboard.dataset.haxracingLayout = layout;
    scoreboard.dataset.haxracingScoreboard = "true";
    scoreboard.style.setProperty("display", "flex", "important");
    scoreboard.style.setProperty("align-items", "center", "important");
    scoreboard.style.setProperty("justify-content", "center", "important");
    scoreboard.style.setProperty("gap", "9px", "important");
    scoreboard.style.setProperty("box-sizing", "border-box", "important");
    scoreboard.style.setProperty("padding", "6px 12px", "important");
    scoreboard.style.setProperty("border", `1px solid ${theme.border}`, "important");
    scoreboard.style.setProperty("border-radius", "4px", "important");
    scoreboard.style.setProperty("background", theme.background, "important");
    scoreboard.style.setProperty("color", theme.color, "important");
    scoreboard.style.setProperty("font-family", theme.font, "important");
    scoreboard.style.setProperty("font-weight", "800", "important");
    scoreboard.style.setProperty("font-variant-numeric", "tabular-nums", "important");
    scoreboard.style.setProperty("box-shadow", `0 4px 18px #0008, inset 0 -2px ${theme.accent}`, "important");
    scoreboard.querySelectorAll<HTMLElement>(":scope > :not([data-haxracing-logo])").forEach(child => {
        child.style.setProperty("font-family", theme.font, "important");
        child.style.setProperty("font-weight", "800", "important");
        child.style.setProperty("color", theme.color, "important");
    });

    let logo = scoreboard.querySelector<HTMLImageElement>(":scope > [data-haxracing-logo]");
    if (!logo) {
        logo = doc.createElement("img");
        logo.dataset.haxracingLogo = "true";
        logo.alt = SCOREBOARD_STYLE_LABELS[config.scoreboardStyle];
        logo.draggable = false;
        scoreboard.insertBefore(logo, scoreboard.firstChild);
    }
    logo.src = COMPETITION_LOGOS[theme.logo];
    logo.style.cssText = `display:block;width:${theme.logo === "haxball" ? 82 : 58}px;height:28px;object-fit:contain;background:${theme.logo === "haxball" ? "transparent" : "#fff"};border-radius:2px;flex:0 0 auto;pointer-events:none;`;

    if (config.scoreboardPosition !== "default") {
        scoreboard.style.setProperty("position", "fixed", "important");
        scoreboard.style.setProperty("z-index", "10001", "important");
        scoreboard.style.setProperty("transform", "none", "important");
        if (config.scoreboardPosition.startsWith("top-")) scoreboard.style.setProperty("top", "12px", "important");
        if (config.scoreboardPosition.startsWith("bottom-")) scoreboard.style.setProperty("bottom", "12px", "important");
        if (config.scoreboardPosition.endsWith("left")) scoreboard.style.setProperty("left", "12px", "important");
        if (config.scoreboardPosition.endsWith("right")) scoreboard.style.setProperty("right", "12px", "important");
        if (config.scoreboardPosition === "bottom-center") {
            scoreboard.style.setProperty("left", "50%", "important");
            scoreboard.style.setProperty("transform", "translateX(-50%)", "important");
        }
    }
};
const HUD_PRESETS = [
    { name: "F1 · Classic", percentages: [30, 42, 53, 64, 75, 85, 94, 100], maxSpeedKmh: 350, speedMultiplier: 1 },
    { name: "F1 · New Gen", percentages: [30, 42, 53, 64, 75, 85, 94, 100], maxSpeedKmh: 350, speedMultiplier: 0.6 },
    { name: "F1 · New Gen V3", percentages: [30, 42, 53, 64, 75, 85, 94, 100], maxSpeedKmh: 350, speedMultiplier: 0.75 },
    { name: "GT · Classic", percentages: [22, 39, 55, 70, 85, 100], maxSpeedKmh: 280, speedMultiplier: 0.75 },
    { name: "GT · New Gen", percentages: [22, 39, 55, 70, 85, 100], maxSpeedKmh: 280, speedMultiplier: 0.5 },
    { name: "GT · New Gen V3", percentages: [22, 39, 55, 70, 85, 100], maxSpeedKmh: 280, speedMultiplier: 0.55 },
];

export const removeRacingHud = (): void => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
    const doc = gameframe?.contentDocument;
    doc?.getElementById("haxracing-hud")?.remove();
    doc?.getElementById("haxracing-hud-style")?.remove();
    doc?.getElementById("haxracing-key-indicator")?.remove();
    doc?.getElementById("haxracing-start-lights")?.remove();
    if (doc) {
        doc.querySelectorAll<HTMLElement>("[data-haxracing-scoreboard='true']").forEach(scoreboard => {
            scoreboard.querySelector(":scope > [data-haxracing-logo]")?.remove();
            scoreboard.style.cssText = originalScoreboardStyles.get(scoreboard) || "";
            delete scoreboard.dataset.haxracingScoreboard;
            delete scoreboard.dataset.haxracingLayout;
        });
    }
    removeKeyListeners?.();
    if (speedPoller !== null) window.clearInterval(speedPoller);
    speedPoller = null;
};

const readConfig = async (): Promise<HudConfig> => {
    const prefs = await window.electronAPI.getAppPreferences();
    const saved = prefs.hud as Partial<HudConfig> | undefined;
    const dashboardStyle = saved?.dashboardStyle && saved.dashboardStyle in DASHBOARD_THEMES
        ? saved.dashboardStyle
        : DEFAULT_CONFIG.dashboardStyle;
    return {
        ...DEFAULT_CONFIG,
        ...saved,
        dashboardStyle,
        scoreboardStyle: DASHBOARD_THEMES[dashboardStyle].logoStyle,
        scoreboardPosition: saved?.scoreboardPosition && saved.scoreboardPosition in POSITION_LABELS ? saved.scoreboardPosition : DEFAULT_CONFIG.scoreboardPosition,
        showKeyIndicator: typeof saved?.showKeyIndicator === "boolean" ? saved.showKeyIndicator : DEFAULT_CONFIG.showKeyIndicator,
        keyLayout: saved?.keyLayout === "arrows" ? "arrows" : "wasd",
        keyPosition: saved?.keyPosition && saved.keyPosition in POSITION_LABELS ? saved.keyPosition : DEFAULT_CONFIG.keyPosition,
        gearPercentages: Array.isArray(saved?.gearPercentages)
            ? saved.gearPercentages.filter(Number.isFinite).map(Number)
            : DEFAULT_CONFIG.gearPercentages,
    };
};

export const applyHaxballMenuTheme = async (): Promise<void> => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
    const doc = gameframe?.contentDocument;
    if (!doc?.head) return;
    const prefs = await window.electronAPI.getAppPreferences();
    const savedStyle = (prefs.hud as Partial<HudConfig> | undefined)?.dashboardStyle;
    const style = savedStyle && savedStyle in DASHBOARD_THEMES ? savedStyle : DEFAULT_CONFIG.dashboardStyle;
    applyRacingThemeTokens(doc, style);
    doc.getElementById("haxracing-haxball-theme")?.remove();
    const menuStyle = doc.createElement("style");
    menuStyle.id = "haxracing-haxball-theme";
    menuStyle.textContent = `
      html,body{background:var(--hrn-bg)!important;color:var(--hrn-text)!important}
      .dropdown,.roomlist-view,.room-view,.choose-nickname-view{box-sizing:border-box;color:var(--hrn-text)!important;background:radial-gradient(ellipse at 50% 0%,var(--hrn-panel) 0%,var(--hrn-bg) 66%)!important;font-family:Inter,"Segoe UI",sans-serif!important}
      .dropdown>.container,.roomlist-view>.container,.room-view>.container{box-sizing:border-box!important;width:min(1120px,calc(100vw - 48px))!important;max-width:1120px!important;margin:28px auto!important;padding:24px!important;color:var(--hrn-text)!important;background:var(--hrn-dashboard-background)!important;border:1px solid var(--hrn-line)!important;border-top:2px solid var(--hrn-accent)!important;border-radius:14px!important;box-shadow:0 22px 70px #0008!important}
      .choose-nickname-view>.container,.choose-nickname-view .container{box-sizing:border-box!important;width:min(460px,calc(100vw - 36px))!important;max-width:calc(100vw - 36px)!important;padding:22px!important;color:var(--hrn-text)!important;background:var(--hrn-dashboard-background)!important;border:1px solid var(--hrn-line)!important;border-top:2px solid var(--hrn-accent)!important;border-radius:12px!important;box-shadow:0 22px 70px #000a!important}
      .room-view .container,.roomlist-view .container{color:var(--hrn-text)!important}
      .room-view .player-list-view,.roomlist-view .room-list,.roomlist-view [data-hook="list"],.roomlist-view .room-entry,.roomlist-view .room-card{color:var(--hrn-text)!important;background:var(--hrn-card)!important;border-color:var(--hrn-line)!important;border-radius:9px!important}
      .roomlist-view>.container{width:min(1180px,calc(100vw - 48px))!important;max-width:1180px!important;padding:clamp(18px,3vw,34px)!important}
      .roomlist-view .splitter{box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr) 205px!important;align-items:start!important;gap:18px!important;width:100%!important}
      .roomlist-view .splitter>.buttons{display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-content:start!important;gap:8px!important;min-width:0!important;padding:0!important;border:0!important;background:transparent!important}
      .roomlist-view .splitter>.buttons>button{display:flex!important;align-items:center!important;justify-content:flex-start!important;width:100%!important;min-width:0!important;min-height:42px!important;padding:8px 12px!important;border-left:2px solid var(--hrn-accent)!important;border-radius:5px!important;background:linear-gradient(100deg,var(--hrn-card),rgba(8,12,14,.78))!important;color:var(--hrn-text)!important;text-align:left!important;letter-spacing:.02em!important}
      .roomlist-view [data-hook="list"]{overflow:auto!important;scrollbar-color:var(--hrn-line) var(--hrn-bg)!important;background:transparent!important;border:0!important;border-radius:0!important}
      .roomlist-view table{width:100%!important;min-width:520px!important;border-collapse:separate!important;border-spacing:0 5px!important}
      .roomlist-view th{padding:10px 12px!important;background:var(--hrn-panel)!important;color:var(--hrn-muted)!important;font-size:9px!important;font-weight:800!important;letter-spacing:.13em!important;text-align:left!important;text-transform:uppercase!important}
      .roomlist-view td{padding:10px 12px!important;border-top:1px solid transparent!important;border-bottom:1px solid transparent!important;background:var(--hrn-card)!important;color:var(--hrn-text)!important;font-size:12px!important}
      .roomlist-view tr:hover td{border-color:var(--hrn-line)!important;background:var(--hrn-card-2)!important}
      .roomlist-view tr.selected td{border-color:var(--hrn-accent)!important;background:var(--hrn-accent-dark)!important}
      .roomlist-view .splitter>.buttons #addfav-btn,.roomlist-view .splitter>.buttons #showfav-btn{border-left-color:var(--hrn-gold)!important}
      .roomlist-view [data-hook="list"]>*,.roomlist-view .room-entry,.roomlist-view .room-card{transition:background .15s ease,border-color .15s ease,transform .15s ease}
      .roomlist-view [data-hook="list"]>*:hover,.roomlist-view .room-entry:hover,.roomlist-view .room-card:hover{background:var(--hrn-card-2)!important;border-color:var(--hrn-accent)!important}
      .room-view button,.roomlist-view button,.dialog button,.dropdown button,.choose-nickname-view button,.room-view select,.roomlist-view select,.dialog select,.room-view input,.roomlist-view input,.dialog input,.dialog textarea,.choose-nickname-view input{box-sizing:border-box!important;color:var(--hrn-text)!important;background:var(--hrn-card)!important;border:1px solid var(--hrn-line)!important;border-radius:7px!important;transition:border-color .15s ease,background .15s ease,box-shadow .15s ease}
      .room-view button,.roomlist-view button,.dialog button,.dropdown button,.choose-nickname-view button{min-height:34px!important;padding:6px 12px!important;font-weight:650!important;cursor:pointer!important}
      .room-view button:hover,.roomlist-view button:hover,.dialog button:hover,.dropdown button:hover,.choose-nickname-view button:hover{background:var(--hrn-card-2)!important;border-color:var(--hrn-accent)!important;box-shadow:0 0 0 2px var(--hrn-accent-soft)!important}
      .room-view button.selected,.roomlist-view button.selected,.dialog button.selected,.dialog .selected{color:#d8fff1!important;background:var(--hrn-accent-dark)!important;border-color:var(--hrn-accent)!important}
      .room-view input,.roomlist-view input,.dialog input,.dialog textarea,.room-view select,.roomlist-view select,.dialog select{min-height:34px!important;padding:7px 10px!important;outline:none!important}
      .room-view input:focus,.roomlist-view input:focus,.dialog input:focus,.dialog textarea:focus,.room-view select:focus,.roomlist-view select:focus,.dialog select:focus{border-color:var(--hrn-accent)!important;box-shadow:0 0 0 3px #55d6ad20!important}
      .room-view input::placeholder,.roomlist-view input::placeholder,.dialog input::placeholder{color:#7f9292!important}
      .dialog{box-sizing:border-box!important;width:min(760px,94vw)!important;min-width:min(620px,92vw)!important;max-width:94vw!important;max-height:88vh!important;overflow:auto!important;padding:20px!important;color:var(--hrn-text)!important;background:linear-gradient(145deg,var(--hrn-panel),var(--hrn-bg) 72%)!important;border:1px solid var(--hrn-line)!important;border-left:3px solid var(--hrn-accent)!important;border-radius:6px!important;box-shadow:0 28px 90px #000b!important}
      .dialog .section,.dialog [data-haxracing-settings-section]{box-sizing:border-box!important;color:var(--hrn-text)!important;background:var(--hrn-panel)!important;border-color:var(--hrn-line)!important}
      .dialog h1,.dialog h2,.dialog h3,.room-view h1,.room-view h2,.roomlist-view h1,.roomlist-view h2{color:var(--hrn-text)!important;letter-spacing:.015em}
      .dialog label,.room-view label,.roomlist-view label{color:#c4d2cf!important}
      .room-view a,.roomlist-view a,.dialog a{color:var(--hrn-accent)!important}
      .dropdown a,.dropdown button{color:var(--hrn-text)!important}
      .choose-nickname-view h1,.choose-nickname-view h2,.choose-nickname-view h3,.choose-nickname-view label{color:var(--hrn-text)!important}
      .room-view table,.roomlist-view table{border-collapse:separate!important;border-spacing:0 5px!important}
      .room-view td,.roomlist-view td,.room-view th,.roomlist-view th{padding:8px 10px!important;border-color:var(--hrn-line)!important}
      .room-view tr,.roomlist-view tr{background:var(--hrn-card)!important}
      .room-view tr:hover,.roomlist-view tr:hover{background:var(--hrn-card-2)!important}
      .dialog button[data-hook="close"],.dialog [data-hook="close"]{border-color:#3a4644!important}
      .dialog.hrn-settings-dialog{width:min(900px,94vw)!important;min-width:min(680px,92vw)!important;padding:24px!important;border-radius:6px!important;border-top:1px solid var(--hrn-line)!important;border-left:3px solid var(--hrn-accent)!important;background:linear-gradient(145deg,var(--hrn-panel),var(--hrn-bg) 72%)!important}
      .hrn-settings-tabs-shell{margin:0 0 14px!important;padding:4px!important;border:1px solid var(--hrn-line)!important;border-radius:5px!important;background:rgba(0,0,0,.2)!important}
      .hrn-settings-tabs{display:flex!important;flex-wrap:wrap!important;gap:5px!important}
      .hrn-settings-tabs button{min-width:90px!important;min-height:35px!important;border-radius:3px!important;background:transparent!important;color:var(--hrn-muted)!important;font-size:9px!important;font-weight:850!important;letter-spacing:.12em!important;text-transform:uppercase!important}
      .hrn-settings-tabs button.selected{background:var(--hrn-accent)!important;color:#101416!important;border-color:var(--hrn-accent)!important;box-shadow:0 2px 12px var(--hrn-accent-soft)!important}
      .hrn-settings-content>.section,.hrn-settings-dialog>.section,.hrn-settings-content>.haxracing-settings-panel{padding:14px!important;border:1px solid var(--hrn-line)!important;border-radius:5px!important;background:rgba(0,0,0,.17)!important}
      .haxracing-settings-panel{scrollbar-color:#35564f #10191c}
      .game-view{font-family:Inter,"Segoe UI",sans-serif!important}
      .game-state-view .bar{background:transparent!important}
      .game-state-view .game-timer-view{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;min-width:112px!important;min-height:36px!important;padding:0 15px!important;border:1px solid var(--hrn-line)!important;border-top:0!important;border-radius:0 0 8px 8px!important;background:linear-gradient(180deg,var(--hrn-panel),var(--hrn-bg))!important;color:var(--hrn-text)!important;font:800 15px/1 Inter,"Segoe UI",sans-serif!important;font-variant-numeric:tabular-nums!important;letter-spacing:.08em!important;box-shadow:0 7px 22px #0007,inset 0 -2px var(--hrn-accent)!important}
      .game-view>.buttons{box-sizing:border-box!important;display:flex!important;align-items:center!important;gap:5px!important;padding:5px!important;border:1px solid var(--hrn-line)!important;border-radius:9px!important;background:rgba(9,13,15,.82)!important;box-shadow:0 8px 24px #0006!important;backdrop-filter:blur(10px)!important}
      .game-view>.buttons button,.game-view .header-btns button,.game-view .sound-button-container button{box-sizing:border-box!important;min-width:34px!important;min-height:32px!important;padding:5px 9px!important;border:1px solid var(--hrn-line)!important;border-radius:6px!important;background:var(--hrn-card)!important;color:var(--hrn-text)!important;font:700 11px Inter,"Segoe UI",sans-serif!important;box-shadow:none!important;transition:background .15s,border-color .15s,transform .15s!important}
      .game-view>.buttons button:hover,.game-view .header-btns button:hover,.game-view .sound-button-container button:hover{background:var(--hrn-card-2)!important;border-color:var(--hrn-accent)!important;transform:translateY(-1px)!important}
      .game-view .sound-button-container{display:flex!important;gap:5px!important;padding:4px!important;border:1px solid var(--hrn-line)!important;border-radius:8px!important;background:rgba(9,13,15,.76)!important;box-shadow:0 6px 20px #0005!important;backdrop-filter:blur(8px)!important}
      .game-view .chatbox-view-contents{box-sizing:border-box!important;border:1px solid var(--hrn-line)!important;border-radius:9px 9px 0 0!important;background:linear-gradient(180deg,rgba(9,13,15,.86),rgba(9,13,15,.72))!important;color:var(--hrn-text)!important;box-shadow:0 -8px 28px #0003!important;backdrop-filter:blur(10px)!important;overflow:hidden!important}
      .game-view .chatbox-view-contents .log .log-contents{box-sizing:border-box!important;padding:8px 10px!important;color:var(--hrn-text)!important;font:12px/1.45 Inter,"Segoe UI",sans-serif!important;text-shadow:0 1px 2px #0008!important;scrollbar-color:var(--hrn-line) var(--hrn-bg)!important}
      .game-view .chatbox-view-contents .log .log-contents p{margin:2px 0!important;color:var(--hrn-text)!important}
      .game-view .chatbox-view-contents>.input{box-sizing:border-box!important;padding:6px!important;border-top:1px solid var(--hrn-line)!important;background:rgba(9,13,15,.92)!important}
      .game-view .chatbox-view-contents>.input input[type=text]{box-sizing:border-box!important;min-height:34px!important;padding:6px 10px!important;border:1px solid var(--hrn-line)!important;border-radius:6px!important;outline:none!important;background:var(--hrn-card)!important;color:var(--hrn-text)!important;font:12px Inter,"Segoe UI",sans-serif!important}
      .game-view .chatbox-view-contents>.input input[type=text]:focus{border-color:var(--hrn-accent)!important;box-shadow:0 0 0 3px var(--hrn-accent-soft)!important}
      .game-view.hrn-glass-ui>.buttons,.game-view.hrn-glass-ui .sound-button-container,.game-view.hrn-glass-ui .chatbox-view-contents,.game-view.hrn-glass-ui .chatbox-view-contents>.input{background:rgba(9,13,15,.2)!important;backdrop-filter:blur(3px)!important}
      .game-view.hrn-glass-ui .chatbox-view-contents>.input input[type=text]{background:rgba(9,13,15,.2)!important}
      @media(max-width:760px){.roomlist-view .splitter{grid-template-columns:minmax(0,1fr)!important}.roomlist-view .splitter>.buttons{grid-template-columns:repeat(2,minmax(0,1fr))!important}.dialog.hrn-settings-dialog{width:96vw!important;min-width:0!important}.hrn-settings-tabs button{flex:1 1 90px!important}}
      @media(max-width:700px){.dropdown>.container,.roomlist-view>.container,.room-view>.container{width:calc(100vw - 20px)!important;margin:10px auto!important;padding:14px!important}.dialog{padding:14px!important}}
    `;
    doc.head.appendChild(menuStyle);
};

const parsePercentageList = (text: string): number[] | null => {
    const values = text.split(/[\s,;]+/).filter(Boolean).map(Number);
    if (values.length < 2 || values.some(value => !Number.isFinite(value) || value <= 0 || value > 100)) return null;
    const ordered = [...values].sort((a, b) => a - b);
    ordered[ordered.length - 1] = 100;
    return ordered;
};

const parseHudMessage = (text: string, state: { lap: string; lastLap: string }): void => {
    const lapMatch = text.match(/\b(?:lap|vuelta)\s*(\d+)\s*(?:\/\s*(\d+))?/i);
    if (lapMatch) state.lap = lapMatch[2] ? `${lapMatch[1]} / ${lapMatch[2]}` : lapMatch[1];

    const lastMatch = text.match(/(?:última|ultima|last)\s*:\s*((?:\d+:)?\d+(?:[.,]\d+)?)/i)
        || text.match(/(?:tiempo de vuelta|lap time)\s*:\s*((?:\d+:)?\d+(?:[.,]\d+)?)/i);
    if (lastMatch) state.lastLap = lastMatch[1].replace(",", ".");
};

const readPlayerSpeed = (gameframe: HTMLIFrameElement): number | null => {
    const contexts = [window, gameframe.contentWindow, gameframe.contentWindow?.parent]
        .filter(Boolean) as Window[];
    for (const context of contexts) {
        const bridge = (context as any).g;
        if (typeof bridge?.getRoomManager !== "function" || typeof bridge?.getPlayerDiscProperties !== "function") continue;
        try {
            const playerId = bridge.getRoomManager()?.room?.roomClientPlayerId;
            if (typeof playerId !== "number") continue;
            const disc = bridge.getPlayerDiscProperties(playerId);
            if (Number.isFinite(disc?.xspeed) && Number.isFinite(disc?.yspeed)) {
                // Match the FH Bot's direct physics-vector calculation. The HUD
                // multiplier is responsible for calibrating this raw value.
                return Math.hypot(disc.xspeed, disc.yspeed);
            }
        } catch { /* HaxBall may not have an active game state yet. */ }
    }
    return readCanvasSpeed();
};

// Observe the player disc's world coordinates from the existing draw calls.
// Each Canvas method still receives the same arguments and runs its original
// implementation, so this does not change the rendered HaxBall frame.
const installCanvasSpeedReader = (gameframe: HTMLIFrameElement): void => {
    const frameWindow = gameframe.contentWindow as (Window & typeof globalThis) | null;
    const CanvasContext = frameWindow?.CanvasRenderingContext2D;
    if (!frameWindow || !CanvasContext || hookedCanvasPrototypes.has(CanvasContext.prototype)) return;
    hookedCanvasPrototypes.add(CanvasContext.prototype);

    type Candidate = { x: number; y: number; score: number; area: number };
    let candidates: Candidate[] = [];
    let frameReadQueued = false;
    let previous: { x: number; y: number; time: number } | null = null;
    let smoothedSpeed: number | null = null;
    const recentSpeeds: number[] = [];
    let rejectedSamples = 0;
    const requestFrame = frameWindow.requestAnimationFrame.bind(frameWindow);

    const recordDisc = (context: CanvasRenderingContext2D, x: number, y: number, radius: number): void => {
        const canvas = context.canvas;
        if (canvas.width < 400 || canvas.height < 250 || radius < 7 || radius > 24) return;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const transform = context.getTransform();
        const pixelX = transform.a * x + transform.c * y + transform.e;
        const pixelY = transform.b * x + transform.d * y + transform.f;
        const screenX = pixelX * rect.width / canvas.width;
        const screenY = pixelY * rect.height / canvas.height;
        const dx = (screenX - rect.width / 2) / rect.width;
        const dy = (screenY - rect.height / 2) / rect.height;
        const centerDistance = dx * dx + dy * dy;
        // Prefer a player-sized disc close to the camera-follow point.
        const score = centerDistance + Math.abs(radius - 15) * 0.0002;
        candidates.push({ x, y, score, area: canvas.width * canvas.height });

        if (frameReadQueued) return;
        frameReadQueued = true;
        requestFrame(() => {
            frameReadQueued = false;
            const now = frameWindow.performance.now();
            const elapsed = previous ? (now - previous.time) / 1000 : 0;
            const target = candidates
                .filter(candidate => candidate.score < 0.16)
                .filter(candidate => !previous || elapsed <= 0 || Math.hypot(candidate.x - previous.x, candidate.y - previous.y) <= Math.max(8, elapsed * 900))
                .sort((a, b) => {
                    const continuityA = previous ? Math.hypot(a.x - previous.x, a.y - previous.y) : 0;
                    const continuityB = previous ? Math.hypot(b.x - previous.x, b.y - previous.y) : 0;
                    // Once tracking starts, prefer the disc that continues the
                    // same path instead of whichever circle happens to be nearer
                    // the screen center in this frame.
                    return (a.score + continuityA * 0.002) - (b.score + continuityB * 0.002) || b.area - a.area;
                })[0];
            candidates = [];
            if (!target) {
                if (previous && now - previous.time > 300) {
                    smoothedSpeed = null;
                    previous = null;
                    recentSpeeds.length = 0;
                    rejectedSamples = 0;
                }
                return;
            }
            if (previous) {
                if (elapsed >= 0.015 && elapsed <= 0.25) {
                    const measured = Math.hypot(target.x - previous.x, target.y - previous.y) / elapsed;
                    const sortedHistory = [...recentSpeeds].sort((a, b) => a - b);
                    const median = sortedHistory.length
                        ? sortedHistory[Math.floor(sortedHistory.length / 2)]
                        : null;
                    // Ignore impossible jumps and isolated spikes. Keep the last
                    // trusted position so one bad circle cannot poison the next
                    // several speed samples.
                    // After standing still, the rolling median contains zeros;
                    // allow the first real movement samples through so the
                    // outlier guard does not mistake acceleration for a glitch.
                    if (measured > 900 || (median !== null && median >= 8 && measured > median * 3 + 35)) {
                        rejectedSamples++;
                        // Never let one mistaken disc or a stale coordinate lock
                        // the reader out. Rebase after a few rejected frames.
                        if (rejectedSamples < 3) return;
                        previous = { x: target.x, y: target.y, time: now };
                        recentSpeeds.length = 0;
                        smoothedSpeed = null;
                        rejectedSamples = 0;
                        return;
                    }
                    rejectedSamples = 0;
                    recentSpeeds.push(measured);
                    if (recentSpeeds.length > 5) recentSpeeds.shift();
                    if (smoothedSpeed === null) smoothedSpeed = measured;
                    else if (measured > smoothedSpeed) smoothedSpeed = smoothedSpeed * 0.45 + measured * 0.55;
                    else smoothedSpeed = smoothedSpeed * 0.7 + measured * 0.3;
                } else if (elapsed > 0.3) {
                    smoothedSpeed = null;
                    recentSpeeds.length = 0;
                    rejectedSamples = 0;
                }
            }
            previous = { x: target.x, y: target.y, time: now };
        });
    };

    const prototype = CanvasContext.prototype;
    const originalArc = prototype.arc;
    prototype.arc = function (this: CanvasRenderingContext2D, x, y, radius, ...rest) {
        try { recordDisc(this, x, y, radius); } catch { /* Ignore canvases without a usable transform. */ }
        return originalArc.call(this, x, y, radius, ...rest);
    };

    const originalEllipse = prototype.ellipse;
    if (originalEllipse) {
        prototype.ellipse = function (this: CanvasRenderingContext2D, x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise) {
            try {
                const radius = (Math.abs(radiusX) + Math.abs(radiusY)) / 2;
                if (Math.abs(radiusX - radiusY) < 2) recordDisc(this, x, y, radius);
            } catch { /* Ignore canvases without a usable transform. */ }
            return originalEllipse.call(this, x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
        };
    }

    readCanvasSpeed = () => previous && frameWindow.performance.now() - previous.time <= 300 ? smoothedSpeed : null;
};

const updateHud = (root: HTMLElement, config: HudConfig, state: { lap: string; lastLap: string; previousSpeedKmh: number | null; trend: "up" | "down" | "steady" }, speed: number | null): void => {
    const lapValue = root.querySelector<HTMLElement>("[data-hud-value='lap']");
    const lastValue = root.querySelector<HTMLElement>("[data-hud-value='last']");
    const speedValue = root.querySelector<HTMLElement>("[data-hud-value='speed']");
    const gearValue = root.querySelector<HTMLElement>("[data-hud-value='gear']");

    if (lapValue) lapValue.textContent = state.lap || "—";
    if (lastValue) lastValue.textContent = state.lastLap ? `${state.lastLap} s` : "—";
    const speedKmh = speed === null ? null : Math.min(config.maxSpeedKmh, Math.max(0, speed * config.speedMultiplier));
    if (speedKmh === null) state.trend = "steady";
    else {
        const change = state.previousSpeedKmh === null ? 0 : speedKmh - state.previousSpeedKmh;
        state.trend = speedKmh <= 1 || Math.abs(change) < 0.8 ? "steady" : change > 0 ? "up" : "down";
        state.previousSpeedKmh = speedKmh;
    }
    if (speedValue) {
        speedValue.textContent = speedKmh === null ? "—" : `${Math.round(speedKmh)} km/h`;
        speedValue.dataset.trend = speedKmh === null ? "" : state.trend;
    }

    if (gearValue) {
        if (speedKmh === null) gearValue.textContent = "—";
        else if (speedKmh <= 1) gearValue.textContent = "N";
        else {
            const gear = config.gearPercentages.findIndex(percent => speedKmh <= config.maxSpeedKmh * percent / 100);
            gearValue.textContent = String(gear === -1 ? config.gearPercentages.length : gear + 1);
        }
    }

    const gearIndex = speedKmh === null || speedKmh <= 1
        ? -1
        : Math.max(0, config.gearPercentages.findIndex(percent => speedKmh <= config.maxSpeedKmh * percent / 100));
    const previousThreshold = gearIndex > 0 ? config.gearPercentages[gearIndex - 1] : 0;
    const nextThreshold = gearIndex >= 0 ? config.gearPercentages[gearIndex] : 100;
    const shiftProgress = gearIndex < 0
        ? 0
        : Math.max(0, Math.min(1, (speedKmh! - config.maxSpeedKmh * previousThreshold / 100) / (config.maxSpeedKmh * (nextThreshold - previousThreshold) / 100)));
    const litCount = Math.round(shiftProgress * 12);
    root.querySelectorAll<HTMLElement>("[data-hud-led]").forEach((led, index) => {
        const color = index < 6 ? "#27e879" : index < 9 ? "#ffd43b" : "#ff424f";
        const lit = index < litCount;
        led.style.background = lit ? color : "#344047";
        led.style.boxShadow = lit ? `0 0 7px ${color}` : "none";
        led.style.opacity = lit ? "1" : ".45";
    });
};

export const appendHudSettingsPanel = async (parent: HTMLElement): Promise<void> => {
    const doc = parent.ownerDocument;
    const config = await readConfig();
    const initialPreferences = await window.electronAPI.getAppPreferences();
    let customPresets = Array.isArray(initialPreferences.hudPresets)
        ? (initialPreferences.hudPresets as HudVehiclePreset[]).filter(preset => preset && typeof preset.name === "string" && Array.isArray(preset.percentages))
        : [];
    const section = document.createElement("section");
    const sectionHeader = document.createElement("div");
    sectionHeader.textContent = "HUD de carreras";
    sectionHeader.style.cssText = "font-size:18px;font-weight:bold;margin-bottom:8px;";
    const sectionDescription = document.createElement("div");
    sectionDescription.textContent = "Configura los datos, el dashboard y los presets del coche desde este panel.";
    sectionDescription.style.cssText = "font-size:13px;color:#aab9c4;line-height:1.4;margin-bottom:12px;";
    section.append(sectionHeader, sectionDescription);
    const form = document.createElement("div");
    form.style.display = "grid";
    form.style.gap = "12px";

    const addToggle = (key: "showLastLap" | "showLapCount" | "showSpeed" | "showGear" | "showKeyIndicator", label: string) => {
        const row = document.createElement("label");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "9px";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = config[key];
        checkbox.dataset.key = key;
        row.append(checkbox, document.createTextNode(label));
        form.appendChild(row);
    };
    addToggle("showLastLap", "Tiempo de la última vuelta");
    addToggle("showLapCount", "Contador de vueltas");
    addToggle("showSpeed", "Velocidad");
    addToggle("showGear", "Marcha");
    addToggle("showKeyIndicator", "Mostrar teclas presionadas");

    const addSelect = <T extends string>(labelText: string, key: string, value: T, options: Record<T, string>): HTMLSelectElement => {
        const label = doc.createElement("label");
        label.textContent = labelText;
        label.style.display = "grid";
        label.style.gap = "6px";
        const select = doc.createElement("select");
        select.dataset.key = key;
        select.style.cssText = "padding:8px;border-radius:5px;border:1px solid #34534d;background:#10191e;color:white;";
        Object.entries(options).forEach(([optionValue, optionLabel]) => {
            const option = doc.createElement("option");
            option.value = optionValue;
            option.textContent = String(optionLabel);
            option.selected = optionValue === value;
            select.appendChild(option);
        });
        label.appendChild(select);
        form.appendChild(label);
        return select;
    };

    const dashboardStyleLabel = document.createElement("label");
    dashboardStyleLabel.textContent = "Tema unificado del dashboard y marcador";
    dashboardStyleLabel.style.display = "grid";
    dashboardStyleLabel.style.gap = "6px";
    const dashboardStyleSelect = document.createElement("select");
    dashboardStyleSelect.dataset.key = "dashboardStyle";
    dashboardStyleSelect.style.cssText = "padding:8px;border-radius:5px;border:1px solid #34534d;background:#10191e;color:white;";
    (Object.keys(DASHBOARD_STYLE_LABELS) as DashboardStyle[]).forEach(style => {
        const option = document.createElement("option");
        option.value = style;
        option.textContent = DASHBOARD_STYLE_LABELS[style];
        option.selected = config.dashboardStyle === style;
        dashboardStyleSelect.appendChild(option);
    });
    dashboardStyleLabel.appendChild(dashboardStyleSelect);
    form.appendChild(dashboardStyleLabel);

    const themeDescription = document.createElement("small");
    themeDescription.textContent = "Este tema coordina el HUD, el marcador, el logotipo y los colores de los menús.";
    themeDescription.style.cssText = "color:#91a5a5;font-size:12px;line-height:1.4;";
    dashboardStyleLabel.appendChild(themeDescription);
    const scoreboardPositionSelect = addSelect("Posición del marcador", "scoreboardPosition", config.scoreboardPosition, SCOREBOARD_POSITION_LABELS);
    const keyLayoutSelect = addSelect("Teclas que se muestran", "keyLayout", config.keyLayout, { wasd: "WASD", arrows: "Flechas" });
    const keyPositionSelect = addSelect("Posición de las teclas", "keyPosition", config.keyPosition, KEY_POSITION_LABELS);

    const presetLabel = document.createElement("label");
    presetLabel.textContent = "Preset de coche";
    presetLabel.style.display = "grid";
    presetLabel.style.gap = "6px";
    const presetSelect = document.createElement("select");
    presetSelect.style.padding = "8px";
    presetSelect.style.borderRadius = "5px";
    presetSelect.style.border = "1px solid #34534d";
    presetSelect.style.background = "#10191e";
    presetSelect.style.color = "white";
    const renderPresetOptions = (): void => {
        presetSelect.replaceChildren();
        const noPreset = document.createElement("option");
        noPreset.value = "";
        noPreset.textContent = "Seleccionar preset…";
        presetSelect.appendChild(noPreset);
        const builtInGroup = document.createElement("optgroup");
        builtInGroup.label = "Incluidos";
        HUD_PRESETS.forEach((preset, index) => {
            const option = document.createElement("option");
            option.value = `builtin:${index}`;
            option.textContent = preset.name;
            builtInGroup.appendChild(option);
        });
        presetSelect.appendChild(builtInGroup);
        if (customPresets.length) {
            const customGroup = document.createElement("optgroup");
            customGroup.label = "Mis presets";
            customPresets.forEach(preset => {
                const option = document.createElement("option");
                option.value = `custom:${preset.id}`;
                option.textContent = preset.name;
                customGroup.appendChild(option);
            });
            presetSelect.appendChild(customGroup);
        }
    };
    renderPresetOptions();
    presetLabel.appendChild(presetSelect);
    form.appendChild(presetLabel);

    const makeNumberRow = (labelText: string, key: string, value: number, step: string): HTMLInputElement => {
        const row = document.createElement("label");
        row.style.display = "grid";
        row.style.gridTemplateColumns = "1fr 150px";
        row.style.alignItems = "center";
        row.style.gap = "12px";
        row.appendChild(document.createTextNode(labelText));
        const input = document.createElement("input");
        input.type = "number";
        input.dataset.key = key;
        input.value = String(value);
        input.min = "0.01";
        input.step = step;
        input.style.padding = "7px";
        input.style.borderRadius = "5px";
        input.style.border = "1px solid #34534d";
        input.style.background = "#10191e";
        input.style.color = "white";
        row.appendChild(input);
        form.appendChild(row);
        return input;
    };
    const multiplierInput = makeNumberRow("Multiplicador de velocidad", "speedMultiplier", config.speedMultiplier, "0.01");
    const maxSpeedInput = makeNumberRow("Velocidad máxima (km/h)", "maxSpeedKmh", config.maxSpeedKmh, "1");

    const gearLabel = document.createElement("label");
    gearLabel.textContent = "Puntos de cambio por marcha (% de velocidad máxima)";
    gearLabel.style.display = "grid";
    gearLabel.style.gap = "6px";
    const gearInput = document.createElement("input");
    gearInput.dataset.key = "gearPercentages";
    gearInput.value = config.gearPercentages.join(", ");
    gearInput.placeholder = "18, 35, 53, 72, 88, 100";
    gearInput.style.padding = "8px";
    gearInput.style.borderRadius = "5px";
    gearInput.style.border = "1px solid #34534d";
    gearInput.style.background = "#10191e";
    gearInput.style.color = "white";
    gearLabel.appendChild(gearInput);
    form.appendChild(gearLabel);

    presetSelect.addEventListener("change", () => {
        const [kind, key] = presetSelect.value.split(":");
        const preset = kind === "builtin"
            ? HUD_PRESETS[Number(key)]
            : customPresets.find(item => item.id === key);
        if (!preset) return;
        gearInput.value = preset.percentages.join(", ");
        maxSpeedInput.value = String(preset.maxSpeedKmh);
        multiplierInput.value = String(preset.speedMultiplier);
    });

    const customPresetLabel = document.createElement("label");
    customPresetLabel.textContent = "Nombre para mi preset";
    customPresetLabel.style.display = "grid";
    customPresetLabel.style.gap = "6px";
    const customPresetName = document.createElement("input");
    customPresetName.type = "text";
    customPresetName.maxLength = 32;
    customPresetName.placeholder = "Ej.: GT3 de la sala";
    customPresetName.style.cssText = "padding:8px;border-radius:5px;border:1px solid #34534d;background:#10191e;color:white;";
    customPresetLabel.appendChild(customPresetName);
    form.appendChild(customPresetLabel);

    const presetActions = document.createElement("div");
    presetActions.style.cssText = "display:flex;gap:8px;";
    const savePresetButton = createButton("Guardar preset", "#155e57", "#21786e", async () => {
        const name = customPresetName.value.trim();
        const percentages = parsePercentageList(gearInput.value);
        const maxSpeedKmh = Number(maxSpeedInput.value);
        const speedMultiplier = Number(multiplierInput.value);
        if (!name) {
            customPresetName.style.borderColor = "#e45c58";
            customPresetName.focus();
            return;
        }
        if (!percentages || !Number.isFinite(maxSpeedKmh) || maxSpeedKmh <= 0 || !Number.isFinite(speedMultiplier) || speedMultiplier <= 0) {
            gearInput.style.borderColor = percentages ? "#34534d" : "#e45c58";
            maxSpeedInput.style.borderColor = Number.isFinite(maxSpeedKmh) && maxSpeedKmh > 0 ? "#34534d" : "#e45c58";
            multiplierInput.style.borderColor = Number.isFinite(speedMultiplier) && speedMultiplier > 0 ? "#34534d" : "#e45c58";
            return;
        }
        const existing = customPresets.find(preset => preset.name.toLocaleLowerCase() === name.toLocaleLowerCase());
        const savedPreset: HudVehiclePreset = {
            id: existing?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name,
            percentages,
            maxSpeedKmh,
            speedMultiplier,
        };
        customPresets = existing
            ? customPresets.map(preset => preset.id === existing.id ? savedPreset : preset)
            : [...customPresets, savedPreset];
        await window.electronAPI.setAppPreference("hudPresets", customPresets);
        renderPresetOptions();
        presetSelect.value = `custom:${savedPreset.id}`;
    });
    const deletePresetButton = createButton("Eliminar seleccionado", "#713a3a", "#934444", async () => {
        if (!presetSelect.value.startsWith("custom:")) return;
        const id = presetSelect.value.slice("custom:".length);
        customPresets = customPresets.filter(preset => preset.id !== id);
        await window.electronAPI.setAppPreference("hudPresets", customPresets);
        renderPresetOptions();
    });
    presetActions.append(savePresetButton, deletePresetButton);
    form.appendChild(presetActions);

    const note = document.createElement("div");
    note.textContent = "La lectura de velocidad requiere que el cliente exponga la física de HaxBall. Las marchas se calculan por umbrales; el último porcentaje siempre representa el 100 %.";
    note.style.color = "#aab9c4";
    note.style.fontSize = "12px";
    form.appendChild(note);

    const save = createButton("Guardar HUD", "#155e57", "#21786e", async () => {
        const next: HudConfig = { ...config };
        form.querySelectorAll<HTMLInputElement>("input[data-key]").forEach(input => {
            const key = input.dataset.key;
            if (key === "gearPercentages") return;
            if (key === "showLastLap" || key === "showLapCount" || key === "showSpeed" || key === "showGear" || key === "showKeyIndicator") {
                next[key] = input.checked;
            } else if (key === "speedMultiplier" || key === "maxSpeedKmh") {
                const value = Number(input.value);
                if (Number.isFinite(value) && value > 0) next[key] = value;
            }
        });
        const percentages = parsePercentageList(gearInput.value);
        if (!percentages) {
            gearInput.style.borderColor = "#e45c58";
            return;
        }
        next.gearPercentages = percentages;
        next.dashboardStyle = dashboardStyleSelect.value as DashboardStyle;
        next.scoreboardStyle = DASHBOARD_THEMES[next.dashboardStyle].logoStyle;
        next.scoreboardPosition = scoreboardPositionSelect.value as OverlayPosition;
        next.keyLayout = keyLayoutSelect.value as KeyLayout;
        next.keyPosition = keyPositionSelect.value as OverlayPosition;
        const prefs = await window.electronAPI.getAppPreferences();
        const position = prefs.hud || config;
        await window.electronAPI.setAppPreference("hud", { ...next, left: position.left, top: position.top });
        applyRacingThemeTokens(document, next.dashboardStyle);
        const frame = document.querySelector<HTMLIFrameElement>(".gameframe");
        if (frame?.contentDocument) applyRacingThemeTokens(frame.contentDocument, next.dashboardStyle);
        void setupRacingHud();
    });
    form.appendChild(save);
    section.appendChild(form);
    parent.appendChild(section);
};

export const setupRacingHud = async (): Promise<void> => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
    const doc = gameframe?.contentDocument;
    if (!doc?.body) return;
    const config = await readConfig();
    applyRacingThemeTokens(document, config.dashboardStyle);
    const activeGameView = Array.from(doc.querySelectorAll<HTMLElement>(".game-view"))
        .some(view => view.getClientRects().length > 0 && doc.defaultView?.getComputedStyle(view).display !== "none");
    if (!activeGameView) {
        void applyHaxballMenuTheme();
        return;
    }
    installCanvasSpeedReader(gameframe);

    removeRacingHud();
    void applyHaxballMenuTheme();
    const state: { lap: string; lastLap: string; previousSpeedKmh: number | null; trend: "up" | "down" | "steady" } = {
        lap: "", lastLap: "", previousSpeedKmh: null, trend: "steady",
    };
    const theme = DASHBOARD_THEMES[config.dashboardStyle];

    const root = doc.createElement("section");
    root.id = "haxracing-hud";
    const dashboardMode = config.dashboardStyle !== "normal";
    root.dataset.dashboardStyle = config.dashboardStyle;
    root.style.cssText = `position:fixed;left:${Math.max(0, config.left)}px;top:${Math.max(0, config.top)}px;z-index:9998;min-width:${dashboardMode ? 300 : 235}px;padding:${dashboardMode ? 14 : 12}px 16px;border:1px solid ${theme.border};border-radius:${dashboardMode ? 7 : 10}px;background:${theme.background};box-shadow:0 8px 25px #0008;color:#f3f7f6;font:13px/1.35 ${theme.font};backdrop-filter:blur(8px);user-select:none;`;

    const hudStyle = doc.createElement("style");
    hudStyle.id = "haxracing-hud-style";
    hudStyle.textContent = "#haxracing-hud [data-hud-value='speed']::after{content:'';display:inline-block;width:12px;height:3px;margin-left:7px;vertical-align:middle;border-radius:3px;background:transparent}#haxracing-hud [data-hud-value='speed'][data-trend='up']::after{background:#22c55e;transform:rotate(-25deg)}#haxracing-hud [data-hud-value='speed'][data-trend='down']::after{background:#ef4444;transform:rotate(25deg)}";
    doc.head.appendChild(hudStyle);

    const head = doc.createElement("div");
    head.style.cssText = `display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:move;color:${theme.accent};font-weight:700;letter-spacing:.06em;`;
    const title = doc.createElement("span");
    title.textContent = "HAXRACING";
    head.append(title);
    root.appendChild(head);

    if (dashboardMode) {
        const shiftLights = doc.createElement("div");
        shiftLights.dataset.hudShiftLights = "true";
        shiftLights.style.cssText = "display:flex;justify-content:center;gap:6px;margin:4px 0 12px;";
        if (config.dashboardStyle === "vintage") {
            shiftLights.style.margin = "9px 16px 13px";
            shiftLights.style.borderBottom = "1px solid #777367";
            shiftLights.style.paddingBottom = "5px";
            const rpmLabel = doc.createElement("small");
            rpmLabel.textContent = "RPM ×1000";
            rpmLabel.style.cssText = "position:absolute;margin-top:13px;color:#aaa28d;font:9px Consolas,monospace;";
            shiftLights.appendChild(rpmLabel);
        }
        for (let i = 0; i < 12; i++) {
            const led = doc.createElement("span");
            led.dataset.hudLed = "true";
            led.style.cssText = config.dashboardStyle === "vintage"
                ? `width:8px;height:9px;border-radius:2px 2px 0 0;background:#3c3a32;opacity:.45;transform:translateY(-${Math.round(Math.sin(i / 11 * Math.PI) * 5)}px) rotate(${Math.round((i / 11 - .5) * 24)}deg);`
                : "width:10px;height:7px;border-radius:4px;background:#344047;opacity:.45;";
            shiftLights.appendChild(led);
        }
        root.appendChild(shiftLights);
    }

    const content = doc.createElement("div");
    content.style.cssText = dashboardMode
        ? "display:grid;grid-template-columns:1fr auto 92px;grid-template-rows:repeat(3,auto);gap:5px 14px;align-items:center;"
        : "display:grid;grid-template-columns:1fr auto;gap:6px 20px;align-items:baseline;";
    if (config.dashboardStyle === "vintage") {
        content.style.cssText += ";padding:9px 10px;background:linear-gradient(180deg,#a7ad91,#78816f);border:2px inset #4c5148;border-radius:3px;color:#222a23;box-shadow:inset 0 1px 5px #0005;";
    }
    const addValue = (key: string, label: string, value: string, strong = false) => {
        const name = doc.createElement("span");
        name.textContent = label;
        name.style.color = config.dashboardStyle === "vintage" ? "#30382f" : "#a8bab5";
        const output = doc.createElement("strong");
        output.dataset.hudValue = key;
        output.textContent = value;
        const vintageColor = key === "speed" ? "#e89929" : key === "gear" ? "#343c31" : "#252d27";
        output.style.cssText = `text-align:${dashboardMode && key === "gear" ? "center" : "right"};color:${config.dashboardStyle === "vintage" ? vintageColor : strong ? theme.accent : "#fff"};font-size:${dashboardMode && key === "gear" ? "48px" : strong ? dashboardMode ? "27px" : "22px" : "15px"};font-variant-numeric:tabular-nums;${config.dashboardStyle === "vintage" ? "font-family:Consolas,'Courier New',monospace;text-shadow:0 0 4px #d6a04a66;" : ""}${dashboardMode && key === "gear" ? "grid-column:3;grid-row:2 / span 2;line-height:1;" : ""}`;
        if (dashboardMode) {
            const row = key === "lap" ? 1 : key === "last" ? 2 : key === "speed" ? 3 : 1;
            name.style.gridColumn = key === "gear" ? "3" : "1";
            name.style.gridRow = String(row);
            if (key !== "gear") {
                output.style.gridColumn = "2";
                output.style.gridRow = String(row);
            }
            name.style.fontSize = "10px";
            name.style.letterSpacing = ".08em";
            name.style.color = config.dashboardStyle === "vintage" ? "#30382f" : "#aeb9c2";
        }
        content.append(name, output);
    };
    if (config.showLapCount) addValue("lap", "VUELTA", "—");
    if (config.showLastLap) addValue("last", "ÚLTIMA VUELTA", "—");
    if (config.showSpeed) addValue("speed", "VELOCIDAD", "—", true);
    if (config.showGear) addValue("gear", "MARCHA", "—");
    root.appendChild(content);
    doc.body.appendChild(root);
    const keyIndicator = createKeyIndicator(doc, config);
    if (keyIndicator) doc.body.appendChild(keyIndicator);
    const startLights = createStartLights(doc, gameframe, config);
    avoidOverlayCollisions(doc, config);

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    head.addEventListener("pointerdown", event => {
        dragging = true;
        const rect = root.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        head.setPointerCapture(event.pointerId);
    });
    head.addEventListener("pointermove", event => {
        if (!dragging) return;
        root.style.left = `${Math.max(0, event.clientX - offsetX)}px`;
        root.style.top = `${Math.max(0, event.clientY - offsetY)}px`;
    });
    head.addEventListener("pointerup", async () => {
        if (!dragging) return;
        dragging = false;
        const prefs = await window.electronAPI.getAppPreferences();
        const latest = prefs.hud || config;
        await window.electronAPI.setAppPreference("hud", { ...latest, left: parseFloat(root.style.left), top: parseFloat(root.style.top) });
    });

    const chatLog = doc.querySelector<HTMLElement>(".chatbox-view-contents .log .log-contents");
    if (chatLog) {
        const readMessages = (node: Node): void => {
            if (node.nodeType === 3) {
                parseHudMessage(node.textContent || "", state);
                return;
            }
            if (node.nodeType === 1) parseHudMessage(node.textContent || "", state);
            node.childNodes.forEach(readMessages);
        };
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => mutation.addedNodes.forEach(readMessages));
        });
        observer.observe(chatLog, { childList: true, subtree: true, characterData: true });
    }

    applyScoreboardAppearance(doc, config);
    speedPoller = window.setInterval(() => {
        if (!root.isConnected) return;
        startLights.update();
        applyScoreboardAppearance(doc, config);
        avoidOverlayCollisions(doc, config);
        const rawSpeed = config.showSpeed || config.showGear ? readPlayerSpeed(gameframe) : null;
        updateHud(root, config, state, rawSpeed);
    }, 100);
};
