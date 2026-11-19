import { autoUpdater } from "./autoUpdater"
import { injectFavoriteRoomsButtons } from "./favrooms";
import { addTranspUIButton, setGameView, toggleTransparentUI } from "./gameview";
import { setMenuSidebarVisible } from "./ui/setupCustomHeader";
import { applyHaxballMenuTheme, removeRacingHud } from "./hud";
import { trackHaxballView } from "./stats";
import { installCustomStartScreen } from "./startScreen";

export const handleGameView = (viewName: string): void => {
	trackHaxballView(viewName);
	setMenuSidebarVisible(!viewName.includes("game-view"));
	void applyHaxballMenuTheme();
	switch(true) {
		case viewName === "dropdown":
			removeRacingHud();
			window.electronAPI.updateDiscordRPC("Waiting in the Room List")
			autoUpdater();
			break;
		// when a room is entered
		case [
			"game-view", 
			"game-view showing-room-view chat-bg-full", 
			"game-view showing-room-view"
		].includes(viewName):
			window.electronAPI.updateDiscordRPC("Playing in a Room")
			setTimeout(setGameView, 200); // improve, don't use timeout
			break;
		case viewName === "room-view":
			removeRacingHud();
			addTranspUIButton();
			toggleTransparentUI();
			break;
		case viewName === "roomlist-view":
			removeRacingHud();
			injectFavoriteRoomsButtons();
			break;
		case viewName === "choose-nickname-view": {
			removeRacingHud();
			const gameframe = document.querySelector<HTMLIFrameElement>(".gameframe");
			if (gameframe) void installCustomStartScreen(gameframe);
			window.electronAPI.updateDiscordRPC("Preparing to race");
			break;
		}
	}
}
