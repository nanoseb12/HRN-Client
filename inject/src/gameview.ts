import { waitForElement } from "./waitForElement";
import { openSettingsAlert } from "./settings";
import { emojiShortcuts } from "./emojis";
import { appendHudSettingsPanel, setupRacingHud } from "./hud";

const addShortcutListener = async (gameframe: HTMLIFrameElement): Promise<void> => {
	const chatInput = gameframe.contentDocument.querySelector('[data-hook="input"]') as HTMLInputElement;
	const prefs = await window.electronAPI.getAppPreferences();
	const shortcutTuples: [string, string][] = prefs["shortcuts"];
	const shortcutMap = new Map(shortcutTuples);

	const emojiRegex = /:[a-zA-Z0-9_]+:/g;

	chatInput.addEventListener("keyup", () => {
		let text = chatInput.value;

		// Expand shortcut only if the entire input matches
		if (shortcutMap.has(text)) {
			text = shortcutMap.get(text)!;
		}

		// Replace all matching emoji patterns
		text = text.replace(emojiRegex, match => emojiShortcuts[match] || match);

		chatInput.value = text;
	});
};

const settingsObservedDocuments = new WeakSet<Document>();
const settingsExtendedDialogs = new WeakSet<HTMLElement>();

const extendHaxballSettingsMenu = (gameframe: HTMLIFrameElement): void => {
	const doc = gameframe.contentDocument;
	if (!doc?.body || settingsObservedDocuments.has(doc)) return;
	settingsObservedDocuments.add(doc);

	const mountTabs = (): void => {
		const allTabs = Array.from(doc.querySelectorAll<HTMLButtonElement>("button"));
		const labelOf = (button: HTMLButtonElement): string => (button.innerText || button.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
		const soundTab = allTabs.find(button => labelOf(button) === "sound");
		if (!soundTab?.parentElement) return;
		const tabBar = soundTab.parentElement;
		const nativeTabs = Array.from(tabBar.querySelectorAll<HTMLButtonElement>("button"))
			.filter(button => ["sound", "video", "input", "misc"].includes(labelOf(button)));
		if (!tabBar || nativeTabs.length < 4) return;
		const dialog = (soundTab.closest(".dialog") as HTMLElement | null)
			|| (tabBar.parentElement?.parentElement as HTMLElement | null)
			|| tabBar.parentElement;
		if (settingsExtendedDialogs.has(dialog)) return;
		const nativeSections = Array.from(dialog.querySelectorAll<HTMLElement>("div.section"));
		const nativeFallbackPanel = nativeSections.length ? null : (
			(tabBar.parentElement?.nextElementSibling as HTMLElement | null)
			|| Array.from(dialog.children).find(child => child !== tabBar.parentElement
				&& !child.contains(tabBar)
				&& !!child.querySelector("input,select,textarea")) as HTMLElement | undefined
			|| null
		);
		settingsExtendedDialogs.add(dialog);
		dialog.style.width = "min(760px, 92vw)";
		dialog.style.maxHeight = "85vh";
	tabBar.style.display = "flex";
	tabBar.style.flexWrap = "wrap";
	tabBar.style.gap = "4px";

		const customPanel = doc.createElement("div");
		customPanel.className = "section selected haxracing-settings-panel";
		customPanel.style.cssText = "display:none;max-height:55vh;min-height:230px;overflow:auto;padding:10px 12px;box-sizing:border-box;color:#edf4f5;";
		const hudPanel = doc.createElement("div");
		const clientPanel = doc.createElement("div");
		const optimizationPanel = doc.createElement("div");
		const customPanels = [hudPanel, clientPanel, optimizationPanel];
		const customLabels = ["HUD", "Cliente", "Optimización"];
		customPanels.forEach((panel, index) => {
			panel.dataset.haxracingSettingsSection = customLabels[index].toLowerCase();
			panel.style.display = index === 0 ? "block" : "none";
			customPanel.appendChild(panel);
		});
		const appSettings = doc.createElement("div");
		appSettings.style.cssText = "display:grid;gap:14px;";
		clientPanel.appendChild(appSettings);
		const optimizationSettings = doc.createElement("div");
		optimizationSettings.style.cssText = "display:grid;gap:14px;";
		optimizationPanel.appendChild(optimizationSettings);

		const setCustomTab = (activeIndex: number): void => {
			nativeSections.forEach(section => { section.style.setProperty("display", "none", "important"); });
			if (nativeFallbackPanel) nativeFallbackPanel.style.display = "none";
			customPanel.style.setProperty("display", "block", "important");
			customPanel.classList.add("selected");
			customPanels.forEach((panel, index) => { panel.style.display = index === activeIndex ? "block" : "none"; });
			customButtons.forEach((button, index) => {
				button.classList.toggle("selected", index === activeIndex);
				button.setAttribute("aria-pressed", String(index === activeIndex));
			});
		};
		const customButtons = customLabels.map((label, index) => {
			const button = nativeTabs[0].cloneNode(false) as HTMLButtonElement;
			Array.from(button.attributes).forEach(attribute => {
				if (attribute.name !== "class" && attribute.name !== "style") button.removeAttribute(attribute.name);
			});
			button.classList.remove("selected");
			button.setAttribute("aria-pressed", "false");
			button.dataset.haxracingTab = label.toLowerCase();
			button.type = "button";
			button.textContent = label;
			button.addEventListener("click", event => {
				event.preventDefault();
				event.stopPropagation();
				setCustomTab(index);
			});
			tabBar.appendChild(button);
			return button;
		});
		tabBar.addEventListener("click", event => {
			const target = event.target as HTMLElement | null;
			const nativeButton = target?.closest("button");
			if (!nativeButton || !nativeTabs.includes(nativeButton as HTMLButtonElement)) return;
			customPanel.style.setProperty("display", "none", "important");
			customPanel.classList.remove("selected");
			nativeSections.forEach(section => section.style.removeProperty("display"));
			if (nativeFallbackPanel) nativeFallbackPanel.style.removeProperty("display");
			customButtons.forEach(button => {
				button.classList.remove("selected");
				button.setAttribute("aria-pressed", "false");
			});
		}, true);
		const panelHost = nativeSections[0]?.parentElement || nativeFallbackPanel?.parentElement || dialog;
		panelHost.appendChild(customPanel);
		void appendHudSettingsPanel(hudPanel);
		void openSettingsAlert({ client: appSettings, optimization: optimizationSettings });
	};

	const observer = new MutationObserver(mountTabs);
	observer.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
	const settingsButton = doc.querySelector<HTMLButtonElement>('[data-hook="settings"]');
	settingsButton?.addEventListener("click", () => window.setTimeout(mountTabs, 0));
	mountTabs();
};

export const openUnifiedHaxballSettings = (): boolean => {
	const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
	const doc = gameframe?.contentDocument;
	if (!doc) return false;
	const settingsDialogOpen = Array.from(doc.querySelectorAll<HTMLElement>(".dialog"))
		.some(dialog => dialog.getClientRects().length > 0 && /\bSettings\b/i.test(dialog.textContent || ""));
	if (settingsDialogOpen) return true;
	const settingsButton = doc.querySelector<HTMLButtonElement>('[data-hook="settings"]');
	if (!settingsButton) return false;
	settingsButton.click();
	return true;
};

export const toggleTransparentUI = async (): Promise<void> => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
	if (!gameframe?.contentDocument) {
		new Error("Gameframe or contentDocument not found");
		return;
	}

    const prefs = await window.electronAPI.getAppPreferences();
    const enable = prefs["transp_ui"];

    if (enable) {
        // gameframe.contentDocument.getElementsByClassName("game-view chat-bg-full")[0].style.cssText = "--chat-opacity: 0.063;"
        gameframe.contentDocument.getElementsByClassName("game-view")[0].style.cssText = "--chat-opacity: 0.063;"
        gameframe.contentDocument.querySelector(".chatbox-view-contents>.input input[type=text]").style.backgroundColor = "rgba(26, 33, 37, 0.063)"
        gameframe.contentDocument.getElementsByClassName("bar")[0].style.background = "rgba(26, 33, 37, 0.063)"
        gameframe.contentDocument.querySelectorAll(".game-view > .buttons")[0].style.background = "rgba(26, 33, 37, 0.063)"
        gameframe.contentDocument.querySelectorAll(".game-view > .buttons")[0].childNodes.forEach(
            (button) => button.style.background = "rgba(26, 33, 37, 0.063)"
        )
        gameframe.contentDocument.getElementsByClassName("sound-button-container")[0].childNodes.forEach(
            (child) => child.style.background = "rgba(26, 33, 37, 0.063)"
        )
        gameframe.contentDocument.querySelectorAll(".dialog button, .room-view>.container button").forEach((button) => button.style.background = "rgba(26, 33, 37, 0.063)")
        gameframe.contentDocument.querySelectorAll(".top-section  > .room-view > .container > .teams > .player-list-view").forEach(
            (list) => list.childNodes[1].style.background = "rgba(26, 33, 37, 0.063)"
        )
        gameframe.contentDocument.querySelectorAll(".dialog select, .room-view>.container select").forEach((select) => {
            select.style.background = "rgba(26, 33, 37, 0.063)"
            select.style.border = "0px"
        })

        const container = gameframe.contentDocument.getElementsByClassName("container")[0] as HTMLElement;
        container.style.background = "rgba(26, 33, 37, 0.1)";
        container.style.border = "1px solid rgba(255, 255, 255, 0.25)";
        container.style.borderRadius = "8px";
        container.style.boxShadow = `
            inset 0 0 2px rgba(255, 255, 255, 0.35),  /* stronger inner glow */
            0 0 0 1px rgba(255, 255, 255, 0.1),       /* crisper outer outline */
            0 0 6px rgba(255, 255, 255, 0.08)         /* subtle surrounding shimmer */
        `;

        // add shadow to chat messages
        // gameframe.contentDocument.querySelectorAll('.chatbox-view-contents > .log .log-contents p').forEach(p => { p.style.textShadow = "1px 1px 1px #000, 0px 1px 1px #000;"})
    } else {
        const normalChatOpacity = parseFloat(localStorage.getItem("chat_opacity") || "0.8")
        gameframe.contentDocument.getElementsByClassName("game-view")[0].style.cssText = `--chat-opacity: ${normalChatOpacity}`
        gameframe.contentDocument.querySelector(".chatbox-view-contents>.input input[type=text]").style.backgroundColor = "#111619"
        gameframe.contentDocument.getElementsByClassName("bar")[0].style.background = ""
        gameframe.contentDocument.querySelectorAll(".game-view > .buttons")[0].style.background = ""
        gameframe.contentDocument.querySelectorAll(".game-view > .buttons")[0].childNodes.forEach(
            (button) => button.style.background = ""
        )
        gameframe.contentDocument.getElementsByClassName("sound-button-container")[0].childNodes.forEach(
            (child) => child.style.background = ""
        )
        gameframe.contentDocument.querySelectorAll(".dialog button, .room-view>.container button").forEach((button) => button.style.background = "")
        gameframe.contentDocument.querySelectorAll(".top-section  > .room-view > .container > .teams > .player-list-view").forEach(
            (list) => list.childNodes[1].style.background = ""
        )
        gameframe.contentDocument.querySelectorAll(".dialog select, .room-view>.container select").forEach((select) => {
            select.style.background = ""
            select.style.border = "1px solid #111619"
        })

        const container = gameframe.contentDocument.getElementsByClassName("container")[0] as HTMLElement;
        container.style.background = "";
        container.style.border = "";
        container.style.borderRadius = "";
        container.style.boxShadow = "";
        container.style.filter = "";

        // gameframe.contentDocument.querySelectorAll('.chatbox-view-contents > .log .log-contents p').forEach(p => { p.style.textShadow = ""})
    }
}

const removeUnwantedElements = (gameframe: HTMLIFrameElement): void => {
	// gameframe.contentDocument.getElementById("translateDisclaimer").remove();

	// remove button below esc to hide chat placeholder
	(gameframe.contentDocument.querySelector(".chatbox-view-contents>.input input[type=text]") as HTMLInputElement).placeholder = "";

	// remove togglechat
	gameframe.contentDocument.getElementById("toggleChat").childNodes[0].remove();
}

export const addTranspUIButton = async (): Promise<void> => {
    const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
	if (!gameframe?.contentDocument) {
		new Error("Gameframe or contentDocument not found");
		return;
	}

    // wait for the buttons to show up
    const targetElement = await waitForElement(".header-btns");

	const headerButtons = gameframe.contentDocument.getElementsByClassName("header-btns")[0];

    if (gameframe.contentDocument.getElementById("invisui-btn") !== null){
        return;
    }
    
    const prefs = await window.electronAPI.getAppPreferences();
    const enabled = prefs["transp_ui"];
    let transpButton = document.createElement("button") as HTMLButtonElement;
    transpButton.id = "invisui-btn";
    transpButton.innerHTML = enabled ? "Default UI" : "Glass UI";
    transpButton.style.background = enabled
        ? "rgba(26, 33, 37, 0.063)"
        : ""

    transpButton.addEventListener(
        "click",
        async () => {
            const prefs = await window.electronAPI.getAppPreferences();
            const newState = !prefs["transp_ui"]
            transpButton.innerHTML = newState ? "Default UI" : "Glass UI";

            await window.electronAPI.setAppPreference("transp_ui", newState);

            toggleTransparentUI();
        },
        false
    );
    const firstHeaderButton = headerButtons.querySelector("button")
    headerButtons.insertBefore(transpButton, firstHeaderButton)
}

export const setGameView = async (): Promise<void> => {
	const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
	if (!gameframe?.contentDocument) {
		new Error("Gameframe or contentDocument not found");
		return;
	}
	extendHaxballSettingsMenu(gameframe);
	// Mount the HUD first so optional HaxBall UI tweaks cannot prevent it from appearing.
	await setupRacingHud();
	addShortcutListener(gameframe);
	removeUnwantedElements(gameframe);
    await addTranspUIButton();
    await toggleTransparentUI();
}
