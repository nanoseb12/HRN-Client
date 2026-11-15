import { customAlert } from "./alerts";
import { authNewDialog, authShowAlert, resetAuthAlert } from "./auth";
import { loadProfileToLocalStorage } from "./profiles";
import { shortcutListDialog, shortcutNewDialog } from "./shortcuts";
import { createButton } from "./utils";
import { appendHudSettingsPanel } from "./hud";

const createToggleRow = (
		labelText: string,
		options: string[],
		defaultOption: string,
		onChange: (selected: string) => void
	): HTMLDivElement => {
		const row = document.createElement('div');
		row.style.display = 'flex';
		row.style.justifyContent = 'space-between';
		row.style.alignItems = 'center';
		row.style.marginBottom = '15px';
		row.style.gap = '12px';

		const label = document.createElement('div');
		label.textContent = labelText;
		label.style.flex = '0 0 180px';
		label.style.fontWeight = 'bold';

		const buttonGroup = document.createElement('div');
		buttonGroup.style.display = 'flex';
		buttonGroup.style.gap = '10px';
		buttonGroup.style.minWidth = '300px';

		const buttonWidth = `${Math.floor(280 / options.length)}px`;

		const buttonsMap: Record<string, HTMLButtonElement> = {};

		options.forEach(option => {
			const btn = document.createElement('button');
			btn.textContent = option;
			btn.style.width = buttonWidth;
			btn.style.padding = '8px 0';
			btn.style.fontSize = '14px';
			btn.style.fontWeight = 'bold';
			btn.style.border = 'none';
			btn.style.borderRadius = '5px';
			btn.style.cursor = 'pointer';
			btn.style.transition = 'background-color 0.2s, color 0.2s';
			btn.style.backgroundColor = '#1b2125';
			btn.style.color = '#aaa';

			const setActive = (isActive: boolean) => {
				btn.style.backgroundColor = isActive ? '#244967' : '#1b2125';
				btn.style.color = isActive ? 'white' : '#aaa';
				btn.dataset.active = isActive ? 'true' : 'false';
			};

			btn.addEventListener('click', () => {
				Object.entries(buttonsMap).forEach(([opt, b]) => {
					const active = opt === option;
					b.style.backgroundColor = active ? '#244967' : '#1b2125';
					b.style.color = active ? 'white' : '#aaa';
					b.dataset.active = active ? 'true' : 'false';
				});
				onChange(option);
			});

			btn.addEventListener('mouseenter', () => {
				if (btn.dataset.active !== 'true'){
					btn.style.color = 'white';
				} else {
					btn.style.backgroundColor = '#3b5d82';
				}
			});
			btn.addEventListener('mouseleave', () => {
				if (btn.dataset.active !== 'true'){
					btn.style.color = '#aaa';
				} else {
					btn.style.backgroundColor = '#244967';
				}
			});

			setActive(option === defaultOption);
			buttonsMap[option] = btn;
			buttonGroup.appendChild(btn);
		});

		row.appendChild(label);
		row.appendChild(buttonGroup);
		return row;
};

const createDivider = (): HTMLHRElement => {
	const divider = document.createElement('hr');
	divider.style.border = 'none';
	divider.style.borderTop = '1px solid #444';
	divider.style.margin = '20px 0';
	return divider;
};

export const resetPreferencesAlert = (): void => {
    const resetButton = createButton(
		"Confirm Reset",
		"#b2413b", "#D04D46",
		() => {
			window.electronAPI.deletePreferencesFile()
				.then(result => {
					if (result){
						// if preferences deleted, also clear localstorage
						localStorage.clear()
						customAlert(
							"Reset successful", 
							"The app will restart in a few seconds (or do it manually)...", 
							[]
						)
						setTimeout(() => window.electronAPI.restartApp(), 4000)
					}
				})
		}
	)

    customAlert(
        "Are you sure?",
        `This operation will reset the app and delete all your settings.`,
        [resetButton]
    )
}


type EmbeddedSettingsPanels = { client: HTMLElement; optimization: HTMLElement };

export const openSettingsAlert = async (embeddedPanels?: EmbeddedSettingsPanels): Promise<void> => {
	const prefs = await window.electronAPI.getAppPreferences();
	const initialZoom = Math.max(0.1, Math.min(2, Number(prefs["camera_zoom"]) || 1));

	// -- Camera Section --
	const cameraSection = document.createElement('div');
	const cameraHeader = document.createElement('div');
	cameraHeader.textContent = "Cámara";
	cameraHeader.style.fontSize = '18px';
	cameraHeader.style.fontWeight = 'bold';
	cameraHeader.style.marginBottom = '8px';
	const cameraMessage = document.createElement('div');
	cameraMessage.textContent = 'Aleja la vista para abarcar más pista. Este control escala la página del juego, por lo que también cambia el tamaño del chat y el HUD.';
	cameraMessage.style.fontSize = '13px';
	cameraMessage.style.marginBottom = '12px';
	cameraMessage.style.lineHeight = '1.45';
	cameraMessage.style.color = '#aab9c4';
	const cameraRow = document.createElement('div');
	cameraRow.style.display = 'grid';
	cameraRow.style.gridTemplateColumns = '1fr auto auto';
	cameraRow.style.alignItems = 'center';
	cameraRow.style.gap = '12px';
	const zoomSlider = document.createElement('input');
	zoomSlider.type = 'range';
	zoomSlider.min = '0.1';
	zoomSlider.max = '2';
	zoomSlider.step = '0.05';
	zoomSlider.value = initialZoom.toFixed(2);
	zoomSlider.style.width = '100%';
	zoomSlider.style.accentColor = '#39c7a3';
	const zoomValue = document.createElement('strong');
	zoomValue.textContent = `${initialZoom.toFixed(2)}×`;
	zoomValue.style.minWidth = '58px';
	zoomValue.style.textAlign = 'right';
	const resetZoomButton = createButton('Restablecer', '#155e57', '#21786e', () => {
		zoomSlider.value = '1';
		zoomValue.textContent = '1.00×';
		window.electronAPI.setCameraZoom(1);
	});
	zoomSlider.addEventListener('input', () => { zoomValue.textContent = `${Number(zoomSlider.value).toFixed(2)}×`; });
	zoomSlider.addEventListener('change', () => { window.electronAPI.setCameraZoom(Number(zoomSlider.value)); });
	cameraRow.appendChild(zoomSlider);
	cameraRow.appendChild(zoomValue);
	cameraRow.appendChild(resetZoomButton);
	cameraSection.appendChild(cameraHeader);
	cameraSection.appendChild(cameraMessage);
	cameraSection.appendChild(cameraRow);
	cameraSection.appendChild(createDivider());

	// -- General Section --
	const generalSection = document.createElement('div');

	const generalHeader = document.createElement('div');
	generalHeader.textContent = "Rendimiento";
	generalHeader.style.fontSize = '18px';
	generalHeader.style.fontWeight = 'bold';
	generalHeader.style.marginBottom = '10px';

	const generalNote = document.createElement('div');
	generalNote.textContent = "Reinicia el cliente para aplicar cambios de rendimiento.";
	generalNote.style.fontSize = '13px';
	generalNote.style.marginBottom = '15px';
	generalNote.style.color = '#ccc';

	const currentFpsSetting = prefs["fps_unlock"] ? "Sin límite" : "Normal";
	const fpsRow = createToggleRow(
		'Fotogramas por segundo', 
		['Normal', 'Sin límite'], 
		currentFpsSetting, 
		(selected) => {
			const newFpsSetting = (selected === "Normal") ? false : true;
			window.electronAPI.setAppPreference("fps_unlock", newFpsSetting);
		}
	);

	// because discord_rpc was introduced after 0.4.0
	// here we just make sure that if preferences.json doesn't have discord_rpc
	// then we consider it Enabled
	const currentRPCSetting = prefs.hasOwnProperty("discord_rpc")
		? prefs["discord_rpc"] ? "Activado" : "Desactivado"
		: "Activado";

	const discordRPCRow = createToggleRow(
		'Estado en Discord', 
		['Activado', 'Desactivado'], 
		currentRPCSetting, 
		(selected) => {
			const newRPCSetting = (selected === "Activado") ? true : false;
			window.electronAPI.setAppPreference("discord_rpc", newRPCSetting);
		}
	);

	generalSection.appendChild(generalHeader);
	generalSection.appendChild(generalNote);
	generalSection.appendChild(fpsRow);
	generalSection.appendChild(discordRPCRow);
	generalSection.appendChild(createDivider());

	// -- Shortcuts Section --
	const shortcutsSection = document.createElement('div');

	const shortcutsHeader = document.createElement('div');
	shortcutsHeader.textContent = "Atajos";
	shortcutsHeader.style.fontSize = '18px';
	shortcutsHeader.style.fontWeight = 'bold';
	shortcutsHeader.style.marginBottom = '10px';

	const shortcutsMessage = document.createElement('div');
	shortcutsMessage.textContent = 'Crea abreviaturas para comandos, mensajes y emojis frecuentes en el chat.';
	shortcutsMessage.style.fontSize = '13px';
	shortcutsMessage.style.marginBottom = '10px';
	shortcutsMessage.style.lineHeight = '1.4';
	shortcutsMessage.style.color = '#ccc';

	const shortcutsActionRow = document.createElement('div');
	shortcutsActionRow.style.display = 'flex';
	shortcutsActionRow.style.justifyContent = 'space-between';
	shortcutsActionRow.style.gap = '10px';

	const createShortcutButton = createButton("Crear atajo", "#155e57", "#21786e", () => {
		shortcutNewDialog();
	})
	const viewShortcutsButton = createButton("Ver atajos", "#155e57", "#21786e", () => {
		shortcutListDialog();
	})

	shortcutsActionRow.appendChild(createShortcutButton);
	shortcutsActionRow.appendChild(viewShortcutsButton);

	shortcutsSection.appendChild(shortcutsHeader);
	shortcutsSection.appendChild(shortcutsMessage);
	shortcutsSection.appendChild(shortcutsActionRow);
	shortcutsSection.appendChild(createDivider());

	// -- Auth Section --
	const authSection = document.createElement('div');

	const authHeader = document.createElement('div');
	authHeader.textContent = "Identidad de Haxball";
	authHeader.style.fontSize = '18px';
	authHeader.style.fontWeight = 'bold';
	authHeader.style.marginBottom = '10px';

	const authMessage = document.createElement('div');
	authMessage.textContent = 'No es un login ni una contraseña del cliente. Es tu identidad persistente de Haxball; algunas salas la usan para reconocerte y conservar permisos o estadísticas. No compartas tu clave privada. Si cambias la identidad podrías perder ese reconocimiento.';
	authMessage.style.fontSize = '13px';
	authMessage.style.marginBottom = '10px';
	authMessage.style.lineHeight = '1.4';
	authMessage.style.color = '#ccc';

	const authActionRow = document.createElement('div');
	authActionRow.style.display = 'flex';
	authActionRow.style.justifyContent = 'space-between';
	authActionRow.style.gap = '10px';
	authActionRow.style.flexWrap = 'wrap';

	const viewAuthButton = createButton("Ver identidad", "#155e57", "#21786e", () => {
		const player_auth_key = localStorage.getItem("player_auth_key");
		const publicAuth = player_auth_key.split(".")[1]
		const privateKey = player_auth_key
		authShowAlert(publicAuth, privateKey)
	})
	const changeAuthButton = createButton("Cambiar identidad", "#155e57", "#21786e", () => {
		authNewDialog();
	})
	const resetAuthButton = createButton("Nueva identidad", "#8d3938", "#aa4b48", () => {
		resetAuthAlert();
	})

	authActionRow.appendChild(viewAuthButton);
	authActionRow.appendChild(changeAuthButton);
	authActionRow.appendChild(resetAuthButton);

	authSection.appendChild(authHeader);
	authSection.appendChild(authMessage);
	authSection.appendChild(authActionRow);
	authSection.appendChild(createDivider());

	// -- Backup Section --
	const backupSection = document.createElement('div');

	const backupHeader = document.createElement('div');
	backupHeader.textContent = "Respaldo y reinicio";
	backupHeader.style.fontSize = '18px';
	backupHeader.style.fontWeight = 'bold';
	backupHeader.style.marginBottom = '10px';

	const backupMessage = document.createElement('div');
	backupMessage.textContent = 'Exporta o restaura perfiles, atajos y ajustes. También puedes reiniciar el cliente.';
	backupMessage.style.fontSize = '13px';
	backupMessage.style.marginBottom = '10px';
	backupMessage.style.lineHeight = '1.4';
	backupMessage.style.color = '#ccc';

	const backupActionRow = document.createElement('div');
	backupActionRow.style.display = 'flex';
	backupActionRow.style.justifyContent = 'space-between';
	backupActionRow.style.gap = '10px';

	const exportBackupButton = createButton("Exportar respaldo", "#155e57", "#21786e", () => {
		window.electronAPI.exportPreferencesFile()
			.then(result => {
				if (result.success) {
					exportBackupButton.textContent = "¡Exportado!";
					setTimeout(() => exportBackupButton.textContent = "Exportar respaldo", 2000);
				}
			});
	});

	const importBackupButton = createButton("Restaurar respaldo", "#155e57", "#21786e", () => {
		window.electronAPI.importPreferencesFile()
			.then(result => {
				if (result.success) {
					customAlert("Backup restored", "The app will restart in a few seconds (or do it manually)...", []);
					loadProfileToLocalStorage("default");
					setTimeout(() => window.electronAPI.restartApp(), 4000);
				} else {
					importBackupButton.textContent = "Invalid backup!";
					importBackupButton.disabled = true;
					importBackupButton.style.backgroundColor = "#D04D46";
					setTimeout(() => {
						importBackupButton.textContent = "Restore Backup";
						importBackupButton.style.backgroundColor = "#244967";
						importBackupButton.disabled = false;
					}, 2000);
				}
			});
	});

	const resetAppButton = createButton("Restablecer cliente", "#8d3938", "#aa4b48", () => {
		resetPreferencesAlert();
	});

	backupActionRow.appendChild(exportBackupButton);
	backupActionRow.appendChild(importBackupButton);
	backupActionRow.appendChild(resetAppButton);

	backupSection.appendChild(backupHeader);
	backupSection.appendChild(backupMessage);
	backupSection.appendChild(backupActionRow);

	// -- Combine All Sections --
	const container = document.createElement('div');
	container.style.display = 'grid';
	container.style.gap = '4px';
	container.style.maxHeight = '70vh';
	container.style.overflowY = 'auto';
	container.style.paddingRight = '8px';
	if (embeddedPanels) {
		embeddedPanels.optimization.append(cameraSection, generalSection);
		embeddedPanels.client.append(shortcutsSection, authSection, backupSection);
		return;
	}
	container.appendChild(cameraSection);
	await appendHudSettingsPanel(container);
	container.appendChild(generalSection);
	container.appendChild(shortcutsSection);
	container.appendChild(authSection);
	container.appendChild(backupSection);

	// -- Show Alert --
	customAlert('Ajustes de Haxracing', container, []);
};
