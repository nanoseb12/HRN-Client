import { customAlert } from "../alerts";
import { profileManage, Profile } from "../profiles";
import { openSettingsAlert } from "../settings";
import { openUnifiedHaxballSettings } from "../gameview";
import { URL } from "../constants";
import { applyRacingThemeTokens, DashboardStyle } from "../racingTheme";

const SIDEBAR_WIDTH = 228;
let sidebar: HTMLElement | null = null;
let gameframe: HTMLIFrameElement | null = null;
let frameStyleBeforeMenu: Record<string, string> | null = null;
let sidebarVisible = false;

const aboutAlert = (): void => {
	customAlert(
		"Acerca de Haxracing",
		`Cliente comunitario de HaxBall enfocado en carreras. Mantiene el juego original y añade herramientas para la comunidad Haxracing.

		Está basado en el cliente de código abierto de <a target="_blank" href="https://github.com/oghb/haxball-client">oghb</a> y en <a target="_blank" href="https://github.com/xenonsb/Haxball-Room-Extension">HaxBall All-in-one Tool</a>.

		<b>HaxBall Client · GPL-3.0</b>`,
		[]
	);
};

export const helpAlert = (): void => {
	const websiteButton = document.createElement("button");
	websiteButton.textContent = "Abrir HaxBall";
	websiteButton.onclick = () => window.open(URL.website, "_blank");
	const communityButton = document.createElement("button");
	communityButton.textContent = "Comunidad";
	communityButton.onclick = () => window.open(URL.discord, "_blank");
	customAlert("Ayuda", "Abre HaxBall o visita la comunidad para encontrar información y soporte.", [websiteButton, communityButton]);
};

const button = (label: string, icon: string, onClick: () => void, primary = false): HTMLButtonElement => {
	const item = document.createElement("button");
	item.type = "button";
	item.className = `hrn-sidebar-action${primary ? " primary" : ""}`;
	item.innerHTML = `<span class="hrn-sidebar-icon" aria-hidden="true">${icon}</span><span>${label}</span>`;
	item.addEventListener("click", onClick);
	return item;
};

const nativeClick = (labels: string[]): boolean => {
	const doc = gameframe?.contentDocument;
	if (!doc) return false;
	const normalizedLabels = labels.map(label => label.toLocaleLowerCase());
	const visible = Array.from(doc.querySelectorAll<HTMLElement>("button,a,[role='button'],[data-hook]"))
		.filter(element => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
	const target = visible.find(element => {
		const text = (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
		const hook = (element.dataset.hook || "").toLocaleLowerCase();
		return normalizedLabels.includes(text) || normalizedLabels.includes(hook);
	});
	if (!target) return false;
	target.click();
	return true;
};

const saveFrameStyle = (frame: HTMLIFrameElement): Record<string, string> => ({
	position: frame.style.getPropertyValue("position"),
	top: frame.style.getPropertyValue("top"),
	left: frame.style.getPropertyValue("left"),
	right: frame.style.getPropertyValue("right"),
	bottom: frame.style.getPropertyValue("bottom"),
	width: frame.style.getPropertyValue("width"),
	height: frame.style.getPropertyValue("height"),
	maxWidth: frame.style.getPropertyValue("max-width"),
	zIndex: frame.style.getPropertyValue("z-index"),
});

const restoreFrameStyle = (frame: HTMLIFrameElement): void => {
	if (!frameStyleBeforeMenu) return;
	const cssNames: Record<string, string> = { maxWidth: "max-width", zIndex: "z-index" };
	Object.entries(frameStyleBeforeMenu).forEach(([key, value]) => {
		const property = cssNames[key] || key;
		if (value) frame.style.setProperty(property, value);
		else frame.style.removeProperty(property);
	});
};

export const setMenuSidebarVisible = (visible: boolean): void => {
	if (!sidebar || !gameframe) return;
	if (visible) {
		if (!sidebarVisible) frameStyleBeforeMenu = saveFrameStyle(gameframe);
		sidebar.style.display = "flex";
		gameframe.style.setProperty("position", "fixed", "important");
		gameframe.style.setProperty("top", "0", "important");
		gameframe.style.setProperty("left", `${SIDEBAR_WIDTH}px`, "important");
		gameframe.style.setProperty("right", "0", "important");
		gameframe.style.setProperty("bottom", "0", "important");
		gameframe.style.setProperty("width", `calc(100vw - ${SIDEBAR_WIDTH}px)`, "important");
		gameframe.style.setProperty("height", "100vh", "important");
		gameframe.style.setProperty("max-width", "none", "important");
		gameframe.style.setProperty("z-index", "1", "important");
		document.body.classList.add("hrn-menu-mode");
		sidebarVisible = true;
	} else {
		if (!sidebarVisible) return;
		sidebar.style.display = "none";
		restoreFrameStyle(gameframe);
		document.body.classList.remove("hrn-menu-mode");
		sidebarVisible = false;
	}
};

export const setupCustomHeader = async (): Promise<void> => {
	gameframe = document.querySelector<HTMLIFrameElement>(".gameframe");
	if (!gameframe || !document.body) return;
	document.querySelector<HTMLElement>(".header")?.setAttribute("hidden", "true");
	document.getElementById("hrn-sidebar-theme")?.remove();
	const style = document.createElement("style");
	style.id = "hrn-sidebar-theme";
	style.textContent = `
		#hrn-sidebar{position:fixed;inset:0 auto 0 0;z-index:10000;width:${SIDEBAR_WIDTH}px;box-sizing:border-box;display:flex;flex-direction:column;padding:22px 15px 16px;background:linear-gradient(160deg,var(--hrn-panel) 0%,var(--hrn-bg) 70%,var(--hrn-card) 100%);border-right:1px solid var(--hrn-line);box-shadow:12px 0 38px #0005;color:var(--hrn-text);font:14px/1.35 Inter,"Segoe UI",sans-serif;}
		#hrn-sidebar:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:linear-gradient(180deg,var(--hrn-accent),var(--hrn-gold) 70%,transparent);opacity:.9}
		#hrn-sidebar .hrn-brand{display:flex;align-items:center;gap:11px;padding:4px 7px 26px;border-bottom:1px solid var(--hrn-line)}
		#hrn-sidebar .hrn-brand-mark{width:42px;height:42px;display:grid;place-items:center;border:1px solid var(--hrn-accent);border-radius:12px;background:linear-gradient(145deg,var(--hrn-accent-dark),var(--hrn-card));color:var(--hrn-accent);font-size:15px;font-weight:900;letter-spacing:-.08em;box-shadow:0 0 24px var(--hrn-accent-soft)}
		#hrn-sidebar .hrn-brand-name{font-size:15px;font-weight:850;letter-spacing:.13em;color:#f4faf7}
		#hrn-sidebar .hrn-brand-sub{margin-top:3px;color:#8ca39f;font-size:9px;font-weight:700;letter-spacing:.22em}
		#hrn-sidebar .hrn-sidebar-caption{margin:24px 10px 9px;color:var(--hrn-muted);font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}
		#hrn-sidebar .hrn-sidebar-nav{display:grid;gap:5px}
		#hrn-sidebar .hrn-sidebar-action{width:100%;min-height:43px;display:flex;align-items:center;gap:12px;padding:8px 11px;border:1px solid transparent;border-radius:9px;background:transparent;color:var(--hrn-text);opacity:.78;text-align:left;font:650 13px/1.2 Inter,"Segoe UI",sans-serif;cursor:pointer;transition:background .15s,border-color .15s,color .15s,transform .15s}
		#hrn-sidebar .hrn-sidebar-action:hover{background:var(--hrn-card-2);border-color:var(--hrn-line);color:var(--hrn-text);opacity:1;transform:translateX(2px)}
		#hrn-sidebar .hrn-sidebar-action.active{background:linear-gradient(90deg,var(--hrn-accent-dark),var(--hrn-card));border-color:var(--hrn-border);color:var(--hrn-accent);opacity:1}
		#hrn-sidebar .hrn-sidebar-icon{width:20px;color:var(--hrn-accent);font-size:15px;text-align:center}
		#hrn-sidebar .hrn-sidebar-join{margin:18px 3px 0;padding:12px;border:1px solid var(--hrn-line);border-radius:11px;background:var(--hrn-panel)}
		#hrn-sidebar .hrn-sidebar-join-title{margin:0 0 8px;color:var(--hrn-muted);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
		#hrn-sidebar input{width:100%;height:36px;box-sizing:border-box;padding:0 9px;border:1px solid var(--hrn-line);border-radius:7px;background:var(--hrn-bg);color:var(--hrn-text);font:12px Inter,"Segoe UI",sans-serif;outline:none}
		#hrn-sidebar input:focus{border-color:var(--hrn-accent);box-shadow:0 0 0 3px var(--hrn-accent-soft)}
		#hrn-sidebar input::placeholder{color:var(--hrn-muted)}
		#hrn-sidebar .hrn-join-button{margin-top:7px;justify-content:center;background:var(--hrn-accent-dark);color:var(--hrn-accent);border-color:var(--hrn-border)}
		#hrn-sidebar .hrn-join-button:hover{background:var(--hrn-card-2)}
		#hrn-sidebar .hrn-sidebar-spacer{flex:1}
		#hrn-sidebar .hrn-profile-card{display:flex;align-items:center;gap:10px;margin:12px 3px;padding:11px 9px;border:1px solid var(--hrn-line);border-radius:10px;background:var(--hrn-panel);cursor:pointer}
		#hrn-sidebar .hrn-profile-mark{width:31px;height:31px;display:grid;place-items:center;border-radius:50%;background:var(--hrn-accent-dark);color:var(--hrn-accent);font-weight:800}
		#hrn-sidebar .hrn-profile-name{display:block;overflow:hidden;color:var(--hrn-text);font-size:12px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
		#hrn-sidebar .hrn-profile-label{display:block;margin-top:2px;color:var(--hrn-muted);font-size:9px;letter-spacing:.08em;text-transform:uppercase}
		#hrn-sidebar .hrn-sidebar-footer{display:grid;gap:5px;padding-top:10px;border-top:1px solid var(--hrn-line)}
		#hrn-sidebar .hrn-settings-button{background:linear-gradient(100deg,var(--hrn-accent-dark),var(--hrn-card))!important;border-color:var(--hrn-border)!important;color:var(--hrn-accent)!important}
		#hrn-sidebar .hrn-settings-button .hrn-sidebar-icon{color:var(--hrn-accent)}
		#hrn-sidebar .hrn-version{padding:9px 8px 0;color:var(--hrn-muted);font-size:9px;letter-spacing:.12em;text-align:center}
		body.hrn-menu-mode{overflow:hidden!important}
		body.hrn-menu-mode>.header{display:none!important}
	`;
	document.head.appendChild(style);
	document.getElementById("hrn-sidebar")?.remove();
	sidebar = document.createElement("aside");
	sidebar.id = "hrn-sidebar";
	const brand = document.createElement("div");
	brand.className = "hrn-brand";
	brand.innerHTML = `<div class="hrn-brand-mark">HR</div><div><div class="hrn-brand-name">HAXRACING</div><div class="hrn-brand-sub">RACE CLIENT</div></div>`;
	const navCaption = document.createElement("div");
	navCaption.className = "hrn-sidebar-caption";
	navCaption.textContent = "Race control";
	const nav = document.createElement("nav");
	nav.className = "hrn-sidebar-nav";
	const roomsButton = button("Salas", "▦", () => {
		const roomList = gameframe?.contentDocument?.querySelector<HTMLElement>(".roomlist-view");
		if (!roomList || !roomList.getClientRects().length) nativeClick(["play", "jugar", "jogar", "rooms", "salas"]);
	}, true);
	roomsButton.classList.add("active");
	nav.append(roomsButton, button("Ayuda", "?", helpAlert), button("Acerca de", "i", aboutAlert));
	const joinBox = document.createElement("div");
	joinBox.className = "hrn-sidebar-join";
	const joinTitle = document.createElement("div");
	joinTitle.className = "hrn-sidebar-join-title";
	joinTitle.textContent = "Enlace directo";
	const linkInput = document.createElement("input");
	linkInput.type = "url";
	linkInput.placeholder = "Pega un enlace de sala";
	linkInput.setAttribute("aria-label", "Pega un enlace de sala");
	const join = (): void => {
		const raw = linkInput.value.trim();
		try {
			const parsed = new globalThis.URL(raw);
			const roomCode = parsed.searchParams.get("c");
			if (parsed.hostname !== "www.haxball.com" || parsed.pathname !== "/play" || !roomCode || roomCode.length !== 11) throw new Error();
			window.location.href = `https://www.haxball.com/play?c=${encodeURIComponent(roomCode)}`;
		} catch {
			linkInput.value = "";
			linkInput.placeholder = "Enlace de sala no válido";
			window.setTimeout(() => { linkInput.placeholder = "Pega un enlace de sala"; }, 1800);
		}
	};
	linkInput.addEventListener("keydown", event => { if (event.key === "Enter") join(); });
	const joinButton = button("Entrar a la sala", "↗", join);
	joinButton.classList.add("hrn-join-button");
	joinBox.append(joinTitle, linkInput, joinButton);
	const spacer = document.createElement("div");
	spacer.className = "hrn-sidebar-spacer";
	const profileCard = document.createElement("button");
	profileCard.type = "button";
	profileCard.className = "hrn-profile-card";
	profileCard.innerHTML = `<span class="hrn-profile-mark">●</span><span style="min-width:0;text-align:left"><span class="hrn-profile-name">Cargando perfil</span><span class="hrn-profile-label">Perfil activo</span></span>`;
	profileCard.addEventListener("click", () => profileManage());
	const footer = document.createElement("div");
	footer.className = "hrn-sidebar-footer";
	const settingsButton = button("Ajustes", "⚙", () => {
		if (!openUnifiedHaxballSettings()) void openSettingsAlert();
	}, true);
	settingsButton.classList.add("hrn-settings-button");
	const version = document.createElement("div");
	version.className = "hrn-version";
	version.textContent = "HRN CLIENT · HAXRACING";
	footer.append(settingsButton, version);
	sidebar.append(brand, navCaption, nav, joinBox, spacer, profileCard, footer);
	document.body.appendChild(sidebar);
	const prefs = await window.electronAPI.getAppPreferences();
	const currentProfileId = localStorage.getItem("current_profile") || "default";
	const profile = (prefs.profiles || []).find((item: Profile) => item.id === currentProfileId) || prefs.profiles?.[0];
	const profileName = profileCard.querySelector<HTMLElement>(".hrn-profile-name");
	if (profileName) profileName.textContent = profile?.name || "Default";
	applyRacingThemeTokens(document, ((prefs.hud as { dashboardStyle?: DashboardStyle } | undefined)?.dashboardStyle || "normal"));
	setMenuSidebarVisible(true);
};
