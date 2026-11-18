const LOW_EFFECTS_STYLE_ID = "hrn-low-effects-style";

const applyToDocument = (doc: Document | null | undefined, enabled: boolean): void => {
	if (!doc?.documentElement) return;
	doc.documentElement.classList.toggle("hrn-low-effects", enabled);
	let style = doc.getElementById(LOW_EFFECTS_STYLE_ID) as HTMLStyleElement | null;
	if (!enabled) {
		style?.remove();
		return;
	}
	if (style) return;
	style = doc.createElement("style");
	style.id = LOW_EFFECTS_STYLE_ID;
	style.textContent = `
		html.hrn-low-effects *,
		html.hrn-low-effects *::before,
		html.hrn-low-effects *::after {
			animation: none !important;
			transition: none !important;
			box-shadow: none !important;
			backdrop-filter: none !important;
			scroll-behavior: auto !important;
		}
	`;
	doc.head?.appendChild(style);
};

export const applyLowEffectsMode = (enabled: boolean): void => {
	applyToDocument(document, enabled);
	const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement | undefined;
	applyToDocument(gameframe?.contentDocument, enabled);
};
