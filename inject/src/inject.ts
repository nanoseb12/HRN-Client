// inject.ts
import { waitForElement } from "./waitForElement";
import { setupUIElements } from "./ui/setupUIElements"
import { handleGameView } from "./handleview";
import { exportCurrentProfile, loadProfileToLocalStorage, Profile } from "./profiles";
import { attachLocalization, initializeLocalization } from "./i18n";

async function init() {    
    // remove ads, modify header, add command bar
	await initializeLocalization();
	await setupUIElements();

    // load profile
    const preferences = await window.electronAPI.getAppPreferences()
    const profiles: Array<Profile> = preferences["profiles"]
    const currentProfileId = localStorage.getItem("current_profile") || "default"
    const currentProfile = profiles.find(p => p.id === currentProfileId) 
        || profiles.find(p => p.id === "default");

    // this obscenity avoids a reload loop
    if (!sessionStorage.getItem('profileInitialized')) {
        console.log('Setting profile for the first time...');
        sessionStorage.setItem('profileInitialized', 'true');
        console.log(currentProfile)
        if (currentProfile.autosave){
            // for a profile with autosave on,
            // if localstorage has this profile set
            // then on startup we make sure preferences.json
            // matches localstorage
            await exportCurrentProfile();
        } else {
            // for a profile with autosave off
            // we disregard changes in localstorage
            // and load it from preferences.json
            console.log("Loading", currentProfile)
            loadProfileToLocalStorage(currentProfile.id);
        }
        location.reload();
        return;
    }

    // finally show window to user
    window.electronAPI.notifyReadyToShow();

    try {
        await waitForElement("div[class$='view']");
        const gameframe = document.getElementsByClassName("gameframe")[0] as HTMLIFrameElement;
        const frameDocument = gameframe.contentDocument!;
        attachLocalization(frameDocument);
        gameframe.addEventListener("load", () => attachLocalization(gameframe.contentDocument));
        let lastRoutedView = "";
        const routeCurrentView = (): void => {
            const selectors = [".game-view", ".room-view", ".roomlist-view", ".dropdown"];
            const active = selectors
                .flatMap(selector => Array.from(frameDocument.querySelectorAll<HTMLElement>(selector)))
                .find(element => {
                    const style = frameDocument.defaultView!.getComputedStyle(element);
                    return style.display !== "none" && style.visibility !== "hidden" && element.getClientRects().length > 0;
                });
            if (!active) return;
            const viewName = active.className;
            if (viewName === lastRoutedView) return;
            lastRoutedView = viewName;
            handleGameView(viewName);
        };

        const viewObserver = new MutationObserver(routeCurrentView);
        viewObserver.observe(frameDocument.documentElement, {
            characterData: false,
            childList: true,
            attributes: true,
            attributeFilter: ["class", "style"],
            subtree: true,
        });
        routeCurrentView();
        console.log("View observer started!");
    } catch (error) {
        console.error("Failed to initialize observer:", error);
    }
}

init();
