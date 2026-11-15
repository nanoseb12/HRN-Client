import { customAlert } from "../alerts";
import { Profile, profileManage } from "../profiles";
import { openSettingsAlert } from "../settings";
import { openUnifiedHaxballSettings } from "../gameview";
import { waitForElement } from "../waitForElement";
import { URL } from "../constants";

const aboutAlert = (): void => {
    customAlert(
        "Acerca de Haxracing",
        `Cliente comunitario de HaxBall enfocado en carreras. Mantiene el juego original y añade herramientas para la comunidad Haxracing.

        Está basado en el cliente de código abierto de <a target="_blank" href="https://github.com/oghb/haxball-client">oghb</a> y en <a target="_blank" href="https://github.com/xenonsb/Haxball-Room-Extension">HaxBall All-in-one Tool</a>.

        <b>HaxBall Client · GPL-3.0</b>`,
        []
    );
}

export const helpAlert = (): void => {
    const officialWebsiteButton = document.createElement('button');
    officialWebsiteButton.innerText = 'Abrir HaxBall';
    officialWebsiteButton.onclick = () => {
        window.open(URL.website, "_blank");
    };

    const discordButton = document.createElement('button');
    discordButton.innerText = 'Comunidad';
    discordButton.onclick = () => {
        window.open(URL.discord, "_blank");
    };

    customAlert(
        "Ayuda",
        `Abre HaxBall o visita la comunidad para encontrar información y soporte.
        `,
        [officialWebsiteButton, discordButton]
    )
}


export const addAddressBarToHeader = (): void => {
    const centerContainer = document.getElementsByClassName("center-container")[0];
    if (!centerContainer) return;

    centerContainer.innerHTML = "";

    const addressInput = document.createElement("input");
    addressInput.type = "text";
    addressInput.placeholder = "Pega un enlace de sala";
    addressInput.classList.add("address-bar-input");

    // Base styles
    addressInput.style.backgroundColor = "#10191e";
    addressInput.style.color = "white";
    addressInput.style.border = "1px solid #31504b";
    addressInput.style.borderRadius = "6px";
    addressInput.style.padding = "2px 6px";
    addressInput.style.width = "200px";
    addressInput.style.maxWidth = "100%";
    addressInput.style.boxSizing = "border-box";
    addressInput.style.fontSize = "16px";
    addressInput.style.outline = "none";
    addressInput.style.transition = "width 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease";
    addressInput.style.textAlign = "center";

    // Focus effect
    addressInput.addEventListener("focus", () => {
        addressInput.style.width = "100%";
        addressInput.style.border = "2px solid #39c7a3";
        addressInput.style.boxShadow = "0 0 8px rgba(57, 199, 163, 0.25)";
    });

    // Blur effect
    addressInput.addEventListener("blur", () => {
		if (addressInput.value === "") {
			addressInput.style.width = "200px";
		}
        addressInput.style.border = "1px solid #31504b";
		addressInput.style.boxShadow = "none";
	});

	addressInput.addEventListener("input", () => {
		const roomLink = addressInput.value.trim();
		const isValid = /^https:\/\/www\.haxball\.com\/play\?c=.{11}$/.test(roomLink);
	
		if (roomLink === "") {
			// Reset to default color when empty
			addressInput.style.color = "white";
		} else if (isValid) {
			addressInput.style.color = "white"; // Valid input stays white
		} else {
			addressInput.style.color = "rgba(179, 65, 59, 0.8)"; // Invalid = red text
		}
	});

    // Shake animation (CSS keyframes)
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            50% { transform: translateX(4px); }
            75% { transform: translateX(-4px); }
            100% { transform: translateX(0); }
        }
        .shake {
            animation: shake 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // Append the input
    centerContainer.appendChild(addressInput);

    // Expose a global function to trigger shake (for validation error)
    (window as any).triggerInvalidInput = (input: string) => {
        addressInput.placeholder = "Enlace inválido"
		addressInput.value = "";
		// Inject a <style> tag dynamically
		const style = document.createElement("style");
		style.textContent = `
			.address-bar-input::placeholder {
            color: #f08e86 !important;
				opacity: 0.8;
			}
		`;
		document.head.appendChild(style);
        addressInput.classList.add("shake");
        setTimeout(() => {
            addressInput.placeholder = "Pega un enlace de sala"
			addressInput.value = input;
            addressInput.classList.remove("shake");
			document.head.removeChild(style);
        }, 600);
    };

	addressInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault(); // prevent form submission / default action
			const roomLink = addressInput.value.trim();
			const isValid = /^https:\/\/www\.haxball\.com\/play\?c=.{11}$/.test(roomLink);
	
			if (isValid) {
                addressInput.value = ""
                addressInput.placeholder = "Entrando a la sala…"
				setTimeout(() => {
                    window.location.href = roomLink;
                }, 1000)
			} else {
				(window as any).triggerInvalidInput(roomLink);
			}
		}
	});
};

export const setupCustomHeader = async (): Promise<void> => {
    const targetElement = await waitForElement(
        "body > div > div.flexCol.flexGrow > div",
        false
    );

    if (!document.getElementById('font-awesome-4')) {
        const fa = document.createElement('link');
        fa.id = 'font-awesome-4';
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
        document.head.appendChild(fa);
    }

    if (!document.getElementById('haxracing-theme')) {
        const theme = document.createElement('style');
        theme.id = 'haxracing-theme';
        theme.textContent = `
            .header { box-sizing: border-box !important; background: linear-gradient(90deg,#10191e,#17272a) !important; border-bottom: 1px solid #29443f !important; box-shadow: 0 5px 18px #0005 !important; padding: 0 12px !important; min-height: 0 !important; }
            .header .left-container { gap: 10px !important; min-width: 0 !important; overflow: hidden !important; }
            .header .center-container, .header .right-container { min-width: 0 !important; }
            .header .right-container .title { max-width: 100% !important; overflow: hidden !important; }
            .header .right-container .title a { display: block !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
            .header .title a, .header .left-container > a, .header .right-container a { color: #d9e8e5 !important; text-decoration: none !important; font-size: 12px !important; transition: color .15s ease; }
            .header .title a { color: #65daba !important; font-size: 14px !important; font-weight: 800 !important; letter-spacing: .04em; }
            .header .left-container > a:hover, .header .right-container a:hover { color: #65daba !important; }
            .header .right-container .title { padding: 5px 11px; border: 1px solid #34534d; border-radius: 999px; background: #1b2b2c; }
            .header .center-container input { background: #10191e !important; color: #e9f4f1 !important; border: 1px solid #31504b !important; border-radius: 8px !important; }
            #header-toggle-arrow { border: 1px solid #34534d !important; background: #162326 !important; color: #d9e8e5 !important; }
        `;
        document.head.appendChild(theme);
    }

    const header = document.getElementsByClassName("header")[0] as HTMLElement;
    header.innerHTML = ""; // clear old header

    // 🆕 Use CSS Grid to split into 3 equal sections
    header.style.display = "grid";
    header.style.gridTemplateColumns = "minmax(0, 1fr) minmax(180px, 1fr) minmax(0, 1fr)";
    header.style.alignItems = "center";
    header.style.width = "100%";

    const leftContainer = document.createElement("div");
    leftContainer.classList.add("left-container");
    leftContainer.style.display = "flex";
    leftContainer.style.alignItems = "center";
    leftContainer.style.justifyContent = "flex-start";

    const centerContainer = document.createElement("div");
    centerContainer.classList.add("center-container");
    centerContainer.style.display = "flex";
    centerContainer.style.alignItems = "center";
    centerContainer.style.justifyContent = "center";

    const rightContainer = document.createElement("div");
    rightContainer.classList.add("right-container");
    rightContainer.style.display = "flex";
    rightContainer.style.alignItems = "center";
    rightContainer.style.justifyContent = "flex-end";
    rightContainer.style.overflow = "hidden";
    

    // Create the new elements
    const titleSpan = document.createElement("span");
    titleSpan.classList.add("title");
    const titleLink = document.createElement("a");
    // titleLink.href = "https://www.haxball.com/play";
    titleLink.textContent = "🏁 HAXRACING";
    titleSpan.appendChild(titleLink);

    const about = document.createElement("a");
    about.textContent = "Acerca de";
    about.href = "";
    about.style.marginLeft = "15px";
    about.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent the link from navigating
        aboutAlert();
    });

    const help = document.createElement("a");
    help.textContent = "Ayuda";
    help.href = "";
    help.style.marginLeft = "15px";
    help.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent the link from navigating
        helpAlert();
    });

    const preferences = document.createElement("a");
    preferences.textContent = "Ajustes";
    preferences.href = "";
    preferences.style.marginLeft = "15px";
    preferences.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent the link from navigating
        if (!openUnifiedHaxballSettings()) void openSettingsAlert();
    });

    leftContainer.appendChild(titleSpan);
    leftContainer.appendChild(about);
    leftContainer.appendChild(help);
    leftContainer.appendChild(preferences);

    const currentProfileId = localStorage.getItem("current_profile") || "default";
    localStorage.setItem("current_profile", currentProfileId)
    const prefs = await window.electronAPI.getAppPreferences();
    const currentProfile = prefs["profiles"]
        .find((p: Profile) => p.id === currentProfileId);
    const currentProfileName = (currentProfile !== undefined) 
        ? currentProfile.name 
        : "(unknown)"
    
    const currentProfileEl = document.createElement("span");
    currentProfileEl.classList.add("title"); // same style as the title
    currentProfileEl.style.marginLeft = "15px";
    const currentProfileElLink = document.createElement("a");
    currentProfileElLink.href = "";
    currentProfileElLink.textContent = `👤 ${currentProfileName}`;
    currentProfileEl.appendChild(currentProfileElLink);

    currentProfileEl.addEventListener("click", function (event) {
        event.preventDefault();
        profileManage();
    });
    rightContainer.appendChild(currentProfileEl);

    // Append all containers to the header
    header.appendChild(leftContainer);
    header.appendChild(centerContainer);
    header.appendChild(rightContainer);

    localStorage.setItem("header_visible", "true")

    const gameframe = document.getElementsByClassName('gameframe')[0] as HTMLIFrameElement;
    gameframe.contentWindow.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "h") {
            toggleHeaderVisibility();
        }
    });
};

export const toggleHeaderVisibility = (): void => {
    const header = document.getElementsByClassName("header")[0] as HTMLElement;
    if (!header) return;
    const existingArrow = document.getElementById("header-toggle-arrow");

    header.style.setProperty('transition', 'height 0.2s ease, min-height 0.2s ease');
    header.style.setProperty('overflow', 'hidden');
    const isVisible = localStorage.getItem("header_visible") !== "false";

    if (!isVisible) {
        localStorage.setItem("header_visible", "true");
        header.style.setProperty('min-height', '40px', 'important');
        header.style.setProperty('height', '40px', 'important');
        header.style.setProperty('opacity', '1');
        header.style.setProperty('pointer-events', 'auto');
        existingArrow?.remove();
    } else {
        localStorage.setItem("header_visible", "false");
        header.style.setProperty('min-height', '0', 'important');
        header.style.setProperty('height', '0px', 'important');
        header.style.setProperty('opacity', '0');
        header.style.setProperty('pointer-events', 'none');

        if (!existingArrow) {
            const arrow = document.createElement("div");
            arrow.id = "header-toggle-arrow";
            arrow.textContent = "⌄ Mostrar barra";
        
            arrow.style.background = "rgba(16, 25, 30, 0.94)";
            arrow.style.padding = "6px 10px";
            arrow.style.borderRadius = "0 0 8px 0";
            arrow.style.fontSize = "12px";
            arrow.style.color = "white";
            arrow.style.opacity = "0.8";
            arrow.style.cursor = "pointer";
            arrow.style.userSelect = "none";
        
            arrow.style.position = "fixed";
            arrow.style.top = "0";
            arrow.style.left = "0";
            arrow.style.zIndex = "9999";
            arrow.style.pointerEvents = "auto";
        
            // Optional hover effect
            arrow.addEventListener("mouseenter", () => {
                arrow.style.opacity = "1";
            });
            arrow.addEventListener("mouseleave", () => {
                arrow.style.opacity = "0.8";
            });
        
            arrow.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleHeaderVisibility();
            });
            document.body.appendChild(arrow);
        }
    }
};
