import f1StartImage from "../assets/start/f1-start.jpg";
import f1CurrentImage from "../assets/start/f1-verstappen.jpg";
import wecImage from "../assets/start/wec.jpg";
import gt3Image from "../assets/start/gt3.jpg";
import porscheImage from "../assets/start/porsche.jpg";
import vintageImage from "../assets/start/senna.jpg";
import { DASHBOARD_STYLE_LABELS, DashboardStyle, DASHBOARD_THEMES } from "./racingTheme";
import { getLocalizationLanguage } from "./i18n";

const START_IMAGES: Record<DashboardStyle, string> = {
	normal: f1StartImage,
	f1: f1CurrentImage,
	wec: wecImage,
	gt3: gt3Image,
	porsche: porscheImage,
	vintage: vintageImage,
};

const TEXT = {
	en: {
		eyebrow: "HRN RACE CLIENT",
		title: "YOUR RACE\nSTARTS HERE",
		copy: "One track. One clean run. Make it count.",
		classLabel: "CURRENT SERIES",
		formTitle: "Driver identification",
		formCopy: "Choose the name the grid will know you by.",
		nameLabel: "DRIVER NAME",
		placeholder: "Enter your nickname",
		continue: "JOIN THE GRID",
		footnote: "You can change your name later in your profile.",
	},
	es: {
		eyebrow: "HRN · CLIENTE DE CARRERAS",
		title: "TU CARRERA\nEMPIEZA AQUÍ",
		copy: "Una pista. Una vuelta limpia. Haz que cuente.",
		classLabel: "CATEGORÍA ACTUAL",
		formTitle: "Identificación de piloto",
		formCopy: "Elige el nombre con el que te verá la parrilla.",
		nameLabel: "NOMBRE DE PILOTO",
		placeholder: "Escribe tu apodo",
		continue: "ENTRAR A PISTA",
		footnote: "Puedes cambiar tu nombre después desde tu perfil.",
	},
	pt: {
		eyebrow: "HRN · CLIENTE DE CORRIDA",
		title: "SUA CORRIDA\nCOMEÇA AQUI",
		copy: "Uma pista. Uma volta limpa. Faça valer.",
		classLabel: "CATEGORIA ATUAL",
		formTitle: "Identificação do piloto",
		formCopy: "Escolha o nome que a classificação vai mostrar.",
		nameLabel: "NOME DO PILOTO",
		placeholder: "Digite seu apelido",
		continue: "ENTRAR NA PISTA",
		footnote: "Você pode mudar seu nome depois no perfil.",
	},
};

export const installCustomStartScreen = async (gameframe: HTMLIFrameElement): Promise<void> => {
	const doc = gameframe.contentDocument;
	const view = doc?.querySelector<HTMLElement>(".choose-nickname-view");
	if (!doc || !view || view.dataset.hrnStartScreen === "true") return;

	const nativeName = view.querySelector<HTMLInputElement>('[data-hook="input"]');
	const nativeContinue = view.querySelector<HTMLButtonElement>('[data-hook="ok"]');
	if (!nativeName || !nativeContinue) return;

	const prefs = await window.electronAPI.getAppPreferences();
	const savedStyle = (prefs.hud as { dashboardStyle?: DashboardStyle } | undefined)?.dashboardStyle;
	const style: DashboardStyle = savedStyle && savedStyle in DASHBOARD_THEMES ? savedStyle : "normal";
	const theme = DASHBOARD_THEMES[style];
	const language = getLocalizationLanguage();
	const copy = TEXT[language] || TEXT.es;
	const screen = doc.createElement("main");
	screen.className = "hrn-start-screen";
	screen.dataset.theme = style;
	screen.style.setProperty("--hrn-start-image", `url("${START_IMAGES[style]}")`);
	screen.style.setProperty("--hrn-start-accent", theme.accent);
	screen.style.setProperty("--hrn-start-panel", theme.menu.panel);
	screen.style.setProperty("--hrn-start-line", theme.menu.line);
	screen.style.setProperty("--hrn-start-text", theme.menu.text);
	screen.style.setProperty("--hrn-start-muted", theme.menu.muted);
	screen.innerHTML = `
		<div class="hrn-start-image" aria-hidden="true"></div>
		<div class="hrn-start-vignette" aria-hidden="true"></div>
		<div class="hrn-start-layout">
			<section class="hrn-start-intro">
				<div class="hrn-start-eyebrow"><i></i>${copy.eyebrow}</div>
				<div class="hrn-start-title">${copy.title.replace("\n", "<br>")}</div>
				<p class="hrn-start-copy">${copy.copy}</p>
			<div class="hrn-start-series"><span>${copy.classLabel}</span><strong>${DASHBOARD_STYLE_LABELS[style]}</strong><b>${style === "normal" ? "HRN" : style.toUpperCase()}</b></div>
			</section>
			<section class="hrn-start-card">
				<div class="hrn-start-brand"><span>HRN</span><div><strong>HAXRACING</strong><small>RACE CLIENT</small></div></div>
				<div class="hrn-start-rule"></div>
				<h1>${copy.formTitle}</h1>
				<p>${copy.formCopy}</p>
				<label for="hrn-driver-name">${copy.nameLabel}</label>
				<input id="hrn-driver-name" class="hrn-driver-name" maxlength="25" autocomplete="nickname" spellcheck="false">
				<button class="hrn-start-submit" type="button">${copy.continue}<span aria-hidden="true">↗</span></button>
				<div class="hrn-start-footnote">${copy.footnote}</div>
				<div class="hrn-start-card-footer"><span>HRN / 01</span><span>READY TO RACE</span></div>
			</section>
		</div>`;

	const styleElement = doc.createElement("style");
	styleElement.id = "hrn-custom-start-screen-style";
	styleElement.textContent = `
		.choose-nickname-view{position:fixed!important;inset:0!important;z-index:9999!important;width:100vw!important;height:100vh!important;overflow:hidden!important;background:#080b0d!important;font-family:Inter,"Segoe UI",Arial,sans-serif!important}
		.choose-nickname-view>*:not(.hrn-start-screen){display:none!important}
		.hrn-start-screen{position:absolute;inset:0;isolation:isolate;overflow:hidden;display:flex;align-items:center;box-sizing:border-box;padding:clamp(30px,6vw,90px);color:var(--hrn-start-text);background:#080b0d}
		.hrn-start-image,.hrn-start-vignette{position:absolute;inset:0;pointer-events:none}
		.hrn-start-image{z-index:-2;background-image:var(--hrn-start-image);background-size:cover;background-position:center 56%;transform:scale(1.015);animation:hrn-start-image-in 1.2s ease-out both}
		.hrn-start-vignette{z-index:-1;background:linear-gradient(90deg,rgba(5,8,10,.84) 0%,rgba(5,8,10,.60) 38%,rgba(5,8,10,.22) 72%,rgba(5,8,10,.52) 100%),linear-gradient(0deg,rgba(5,8,10,.6),transparent 38%,rgba(5,8,10,.18))}
		.hrn-start-layout{width:min(1160px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(330px,410px);align-items:center;gap:clamp(34px,8vw,130px)}
		.hrn-start-intro{max-width:600px;text-shadow:0 3px 22px #000b}
		.hrn-start-eyebrow{display:flex;align-items:center;gap:10px;color:#f4f5f5;font-size:11px;font-weight:800;letter-spacing:.2em}
		.hrn-start-eyebrow i{width:24px;height:2px;background:var(--hrn-start-accent);box-shadow:0 0 14px var(--hrn-start-accent)}
		.hrn-start-title{margin-top:23px;color:#fff;font-size:clamp(42px,7vw,88px);font-weight:950;line-height:.9;letter-spacing:-.055em;text-wrap:balance}
		.hrn-start-copy{margin:20px 0 0;color:#e4e8e8;font-size:clamp(14px,1.4vw,18px);letter-spacing:.025em}
		.hrn-start-series{display:flex;align-items:center;gap:15px;margin-top:42px;padding:13px 16px;width:max-content;max-width:100%;border-left:2px solid var(--hrn-start-accent);background:linear-gradient(90deg,#080b0dbd,#080b0d00);backdrop-filter:blur(3px)}
		.hrn-start-series span{color:#d5dddd;font-size:9px;font-weight:800;letter-spacing:.17em}
		.hrn-start-series strong{color:var(--hrn-start-accent);font-size:13px;letter-spacing:.12em;text-transform:uppercase}
		.hrn-start-series b{padding-left:14px;border-left:1px solid #ffffff40;color:#ffffffa6;font-size:10px;letter-spacing:.13em}
		.hrn-start-card{box-sizing:border-box;padding:27px 28px 18px;border:1px solid #ffffff32;border-top:2px solid var(--hrn-start-accent);border-radius:8px;background:linear-gradient(145deg,rgba(15,19,22,.94),var(--hrn-start-panel));box-shadow:0 28px 90px #0009;backdrop-filter:blur(18px);animation:hrn-start-card-in .7s .12s ease-out both}
		.hrn-start-brand{display:flex;align-items:center;gap:11px}
		.hrn-start-brand>span{display:grid;place-items:center;width:39px;height:39px;border:1px solid var(--hrn-start-accent);border-radius:6px;color:var(--hrn-start-accent);font-size:12px;font-weight:950;letter-spacing:-.08em}
		.hrn-start-brand strong,.hrn-start-brand small{display:block}
		.hrn-start-brand strong{color:#fff;font-size:12px;letter-spacing:.16em}
		.hrn-start-brand small{margin-top:4px;color:var(--hrn-start-muted);font-size:8px;font-weight:800;letter-spacing:.2em}
		.hrn-start-rule{height:1px;margin:19px 0 23px;background:linear-gradient(90deg,var(--hrn-start-accent),#ffffff1c 75%)}
		.hrn-start-card h1{margin:0;color:#fff;font-size:22px;font-weight:750;letter-spacing:-.02em}
		.hrn-start-card>p{margin:8px 0 25px;color:var(--hrn-start-muted);font-size:12px;line-height:1.5}
		.hrn-start-card label{display:block;margin-bottom:8px;color:#dce3e4;font-size:9px;font-weight:800;letter-spacing:.15em}
		.hrn-driver-name{display:block;width:100%;height:45px;box-sizing:border-box;padding:0 13px;border:1px solid #ffffff30;border-radius:5px;outline:none;background:#050809a8;color:#fff;font:500 14px Inter,"Segoe UI",sans-serif;transition:border .15s,box-shadow .15s}
		.hrn-driver-name:focus{border-color:var(--hrn-start-accent);box-shadow:0 0 0 3px var(--hrn-accent-soft)}
		.hrn-driver-name::placeholder{color:#788487}
		.hrn-start-submit{display:flex;align-items:center;justify-content:space-between;width:100%;height:45px;margin-top:12px;padding:0 15px;border:1px solid var(--hrn-start-accent);border-radius:5px;background:var(--hrn-start-accent);color:#101416;font:850 10px Inter,"Segoe UI",sans-serif;letter-spacing:.15em;cursor:pointer;transition:filter .15s,transform .15s}
		.hrn-start-submit:hover{filter:brightness(1.13);transform:translateY(-1px)}
		.hrn-start-submit span{font-size:17px}
		.hrn-start-footnote{margin-top:13px;color:#a6b0b1;font-size:10px;line-height:1.4}
		.hrn-start-card-footer{display:flex;justify-content:space-between;margin-top:23px;padding-top:12px;border-top:1px solid #ffffff22;color:#849092;font-size:8px;font-weight:800;letter-spacing:.16em}
		@keyframes hrn-start-image-in{from{transform:scale(1.06);filter:brightness(.72)}to{transform:scale(1.015);filter:brightness(1)}}
		@keyframes hrn-start-card-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
		@media(max-width:760px){.hrn-start-screen{padding:24px}.hrn-start-layout{grid-template-columns:1fr;gap:22px}.hrn-start-intro{display:none}.hrn-start-card{width:min(420px,100%);margin:auto}.hrn-start-vignette{background:linear-gradient(90deg,#080b0dbb,#080b0d70),linear-gradient(0deg,#080b0d66,transparent)}}
		@media(prefers-reduced-motion:reduce){.hrn-start-image,.hrn-start-card{animation:none}}
	`;
	doc.head?.appendChild(styleElement);
	const existingName = nativeName.value;
	const originalChildren = Array.from(view.children);
	originalChildren.forEach(child => { (child as HTMLElement).style.display = "none"; });
	view.appendChild(screen);
	view.dataset.hrnStartScreen = "true";

	const nameField = screen.querySelector<HTMLInputElement>(".hrn-driver-name")!;
	nameField.value = existingName;
	nameField.placeholder = copy.placeholder;
	const continueButton = screen.querySelector<HTMLButtonElement>(".hrn-start-submit")!;
	const submitNickname = (): void => {
		const nickname = nameField.value.trim();
		if (!nickname) {
			nameField.focus();
			nameField.setCustomValidity(copy.placeholder);
			nameField.reportValidity();
			return;
		}
		nameField.setCustomValidity("");
		nativeName.value = nickname;
		const EventConstructor = doc.defaultView?.Event || Event;
		nativeName.dispatchEvent(new EventConstructor("input", { bubbles: true }));
		nativeName.dispatchEvent(new EventConstructor("change", { bubbles: true }));
		nativeContinue.click();
	};
	continueButton.addEventListener("click", submitNickname);
	nameField.addEventListener("input", () => nameField.setCustomValidity(""));
	nameField.addEventListener("keydown", event => {
		if (event.key === "Enter") {
			event.preventDefault();
			submitNickname();
		}
	});
	nameField.focus();
};
