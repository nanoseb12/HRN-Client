import { createButton } from "./utils";
import { COMPETITION_LOGOS } from "./scoreboardLogos";

type DashboardStyle = "normal" | "f1" | "wec" | "gt3" | "porsche" | "vintage";
type ScoreboardStyle = "haxball" | "f1" | "f1-vintage" | "wec" | "porsche-cup";
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
const DASHBOARD_THEMES: Record<DashboardStyle, { accent: string; border: string; background: string; font: string }> = {
    normal: { accent: "#65daba", border: "#4c6c64", background: "linear-gradient(145deg,rgba(18,29,32,.96),rgba(10,16,18,.94))", font: "Arial,sans-serif" },
    f1: { accent: "#ff3548", border: "#792631", background: "linear-gradient(145deg,rgba(35,16,21,.97),rgba(12,13,17,.96))", font: "Arial,sans-serif" },
    wec: { accent: "#55c7ff", border: "#285577", background: "linear-gradient(145deg,rgba(13,31,48,.97),rgba(9,15,23,.96))", font: "Arial,sans-serif" },
    gt3: { accent: "#ffc857", border: "#755c2e", background: "linear-gradient(145deg,rgba(38,31,16,.97),rgba(15,16,15,.96))", font: "Arial,sans-serif" },
    porsche: { accent: "#ef5b52", border: "#69332f", background: "linear-gradient(145deg,rgba(32,23,23,.97),rgba(12,13,15,.96))", font: "Arial,sans-serif" },
    vintage: { accent: "#e3c99a", border: "#8e7653", background: "linear-gradient(145deg,rgba(35,34,31,.98),rgba(18,19,18,.98))", font: "Consolas,'Courier New',monospace" },
};
const DASHBOARD_STYLE_LABELS: Record<DashboardStyle, string> = {
    normal: "Normal", f1: "F1", wec: "WEC", gt3: "GT3", porsche: "Porsche", vintage: "Vintage",
};
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
    const theme = SCOREBOARD_THEMES[config.scoreboardStyle];
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
    const theme = SCOREBOARD_THEMES[config.scoreboardStyle];
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

const applyScoreboardAppearance = (doc: Document, config: HudConfig): void => {
    const scoreboard = findScoreboard(doc);
    if (!scoreboard) return;
    if (!originalScoreboardStyles.has(scoreboard)) originalScoreboardStyles.set(scoreboard, scoreboard.style.cssText);

    const theme = SCOREBOARD_THEMES[config.scoreboardStyle];
    const previousLayout = scoreboard.dataset.haxracingLayout;
    const layout = `${config.scoreboardStyle}:${config.scoreboardPosition}`;
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
    return {
        ...DEFAULT_CONFIG,
        ...saved,
        dashboardStyle: saved?.dashboardStyle && saved.dashboardStyle in DASHBOARD_THEMES ? saved.dashboardStyle : DEFAULT_CONFIG.dashboardStyle,
        scoreboardStyle: saved?.scoreboardStyle && saved.scoreboardStyle in SCOREBOARD_THEMES ? saved.scoreboardStyle : DEFAULT_CONFIG.scoreboardStyle,
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
    const theme = DASHBOARD_THEMES[style];
    doc.getElementById("haxracing-haxball-theme")?.remove();
    const menuStyle = doc.createElement("style");
    menuStyle.id = "haxracing-haxball-theme";
    const panel = style === "vintage" ? "#24231f" : "#10191e";
    const surface = style === "vintage" ? "#34332d" : "#1a272e";
    const text = style === "vintage" ? "#e3c99a" : "#edf4f5";
    menuStyle.textContent = `
      .room-view>.container,.roomlist-view>.container,.room-view .container,.roomlist-view .container,.dialog,.dropdown{background:${panel};color:${text};border:1px solid ${theme.border};border-radius:7px;box-shadow:0 8px 26px #0008}
      .room-view .player-list-view,.roomlist-view .room-list,.roomlist-view .room-entry,.roomlist-view .room-card{background:${surface};color:${text};border-color:${theme.border}}
      .room-view button,.roomlist-view button,.dialog button,.dropdown button,.room-view select,.roomlist-view select,.dialog select,.room-view input,.roomlist-view input,.dialog input{background:${surface};color:${text};border:1px solid ${theme.border};border-radius:4px}
      .room-view button:hover,.roomlist-view button:hover,.dialog button:hover,.dropdown button:hover{border-color:${theme.accent};box-shadow:0 0 8px ${theme.accent}55}
      .game-view>.buttons button,.game-view>.buttons .sound-button-container>*{border-color:${theme.border};color:${text}}
      .room-view .player-list-view,.roomlist-view .room-entry,.roomlist-view .room-card{transition:border-color .15s ease,background .15s ease}
      .room-view .player-list-view:hover,.roomlist-view .room-entry:hover,.roomlist-view .room-card:hover{border-color:${theme.accent}}
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
    dashboardStyleLabel.textContent = "Estilo del dashboard";
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

    const scoreboardStyleSelect = addSelect("Estilo del marcador", "scoreboardStyle", config.scoreboardStyle, SCOREBOARD_STYLE_LABELS);
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
        next.scoreboardStyle = scoreboardStyleSelect.value as ScoreboardStyle;
        next.scoreboardPosition = scoreboardPositionSelect.value as OverlayPosition;
        next.keyLayout = keyLayoutSelect.value as KeyLayout;
        next.keyPosition = keyPositionSelect.value as OverlayPosition;
        const prefs = await window.electronAPI.getAppPreferences();
        const position = prefs.hud || config;
        await window.electronAPI.setAppPreference("hud", { ...next, left: position.left, top: position.top });
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
    installCanvasSpeedReader(gameframe);

    removeRacingHud();
    const config = await readConfig();
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
        const rawSpeed = config.showSpeed || config.showGear ? readPlayerSpeed(gameframe) : null;
        updateHud(root, config, state, rawSpeed);
    }, 100);
};
