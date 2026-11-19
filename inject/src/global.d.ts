export {};

declare global {
	interface Window {
		electronAPI: {
			setAppPreference: (key: string, value: any) => Promise<any>;
			setCameraZoom: (factor: number) => Promise<number>;
			getAppPreferences: () => Promise<any>;
			restartApp: () => void;
			notifyReadyToShow: () => void;
			exportPreferencesFile: () => Promise<any>;
			importPreferencesFile: () => Promise<any>;
			deletePreferencesFile: () => Promise<any>;
			getAppVersion: () => Promise<string>;
			generatePlayerAuthKey: () => Promise<string>;
			connectDiscordAccount: () => Promise<{ id: string; username: string; avatarUrl: string; linkedAt: string }>;
			updateDiscordRPC: (details: string) => void;
		};
	}
};
