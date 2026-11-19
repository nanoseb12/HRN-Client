export type DashboardStyle = "normal" | "f1" | "wec" | "gt3" | "porsche" | "vintage";
export type ScoreboardStyle = "haxball" | "f1" | "f1-vintage" | "wec" | "porsche-cup";

type RacingTheme = {
	accent: string;
	border: string;
	background: string;
	font: string;
	menu: {
		bg: string;
		panel: string;
		card: string;
		card2: string;
		line: string;
		text: string;
	muted: string;
	accentDark: string;
	gold: string;
	};
	logoStyle: ScoreboardStyle;
};

export const DASHBOARD_THEMES: Record<DashboardStyle, RacingTheme> = {
	normal: { accent: "#65daba", border: "#4c6c64", background: "linear-gradient(145deg,rgba(18,29,32,.96),rgba(10,16,18,.94))", font: "Arial,sans-serif", logoStyle: "haxball", menu: { bg: "#0b1113", panel: "#111b1f", card: "#172429", card2: "#1c2b30", line: "#2c4145", text: "#edf4f2", muted: "#91a5a5", accentDark: "#183e36", gold: "#e5bb67" } },
	f1: { accent: "#ff3548", border: "#792631", background: "linear-gradient(145deg,rgba(35,16,21,.97),rgba(12,13,17,.96))", font: "Arial,sans-serif", logoStyle: "f1", menu: { bg: "#100c0e", panel: "#1b1114", card: "#28191d", card2: "#351d23", line: "#512830", text: "#f8eeee", muted: "#ae8f92", accentDark: "#451c24", gold: "#ff9b61" } },
	wec: { accent: "#55c7ff", border: "#285577", background: "linear-gradient(145deg,rgba(13,31,48,.97),rgba(9,15,23,.96))", font: "Arial,sans-serif", logoStyle: "wec", menu: { bg: "#09111a", panel: "#101d29", card: "#172a39", card2: "#20384a", line: "#294b62", text: "#eff7fc", muted: "#91a9b8", accentDark: "#173b53", gold: "#a4d65e" } },
	gt3: { accent: "#ffc857", border: "#755c2e", background: "linear-gradient(145deg,rgba(38,31,16,.97),rgba(15,16,15,.96))", font: "Arial,sans-serif", logoStyle: "haxball", menu: { bg: "#12100b", panel: "#201b11", card: "#2d2517", card2: "#3b301b", line: "#5a4828", text: "#faf4e7", muted: "#b4a684", accentDark: "#493817", gold: "#ffc857" } },
	porsche: { accent: "#ef5b52", border: "#69332f", background: "linear-gradient(145deg,rgba(32,23,23,.97),rgba(12,13,15,.96))", font: "Arial,sans-serif", logoStyle: "porsche-cup", menu: { bg: "#110d0e", panel: "#1d1516", card: "#2a1d1e", card2: "#382426", line: "#583537", text: "#f7eeee", muted: "#b39b9b", accentDark: "#472426", gold: "#c4c6ca" } },
	vintage: { accent: "#e3c99a", border: "#8e7653", background: "linear-gradient(145deg,rgba(35,34,31,.98),rgba(18,19,18,.98))", font: "Consolas,'Courier New',monospace", logoStyle: "f1-vintage", menu: { bg: "#12110f", panel: "#211f1b", card: "#302d26", card2: "#3c382f", line: "#635741", text: "#eee2c7", muted: "#b0a487", accentDark: "#51432a", gold: "#e3c99a" } },
};

export const DASHBOARD_STYLE_LABELS: Record<DashboardStyle, string> = {
	normal: "Normal",
	f1: "F1",
	wec: "WEC",
	gt3: "GT3",
	porsche: "Porsche",
	vintage: "Vintage",
};

export const applyRacingThemeTokens = (doc: Document, style: DashboardStyle): void => {
	const theme = DASHBOARD_THEMES[style] || DASHBOARD_THEMES.normal;
	const root = doc.documentElement;
	root.style.setProperty("--hrn-bg", theme.menu.bg);
	root.style.setProperty("--hrn-panel", theme.menu.panel);
	root.style.setProperty("--hrn-card", theme.menu.card);
	root.style.setProperty("--hrn-card-2", theme.menu.card2);
	root.style.setProperty("--hrn-line", theme.menu.line);
	root.style.setProperty("--hrn-text", theme.menu.text);
	root.style.setProperty("--hrn-muted", theme.menu.muted);
	root.style.setProperty("--hrn-accent", theme.accent);
	root.style.setProperty("--hrn-accent-soft", `${theme.accent}24`);
	root.style.setProperty("--hrn-accent-dark", theme.menu.accentDark);
	root.style.setProperty("--hrn-gold", theme.menu.gold);
	root.style.setProperty("--hrn-border", theme.border);
	root.style.setProperty("--hrn-dashboard-background", theme.background);
};
