# HRN Client — HaxBall para Haxracing

HRN Client es un cliente de escritorio de HaxBall enfocado en Haxracing. Está basado en [HaxBall Client de og](https://github.com/oghb/haxball-client), y añade herramientas para carreras como un HUD personalizable con velocidad, marchas y vueltas, además de ajustes integrados para el cliente.

Usa [Electron](https://github.com/electron/electron) y se distribuye con la extensión [HaxBall All-in-one Tool](https://github.com/xenonsb/Haxball-Room-Extension).

The client works on **Windows** (64bit/32bit/ARM), **macOS** (Apple Silicon/Intel), and **Linux** (64bit).

✨ **Features at a glance:**

* Comes with the [All-in-one Tool](https://github.com/xenonsb/Haxball-Room-Extension/)
* No ads
* Unlockable FPS
* User profiles
* Favorite rooms
* Haxracing room tags and a dedicated room-list filter
* Chat shortcuts
* Glass UI (if enabled)
* Easy Auth management

## Descarga para Windows

Descarga el instalador x64 desde [Releases de HRN Client](https://github.com/nanoseb12/HRN-Client/releases). El archivo también está disponible en la carpeta `dist` de este repositorio.

## How to install and run

Las compilaciones para macOS y Linux todavía no están publicadas. Las instrucciones que siguen describen el proceso heredado del proyecto base y pueden requerir ajustes para HRN Client.

Then

* if you're on **Windows**, extract the executable from the downloaded archive and run it. No installation needed. If you get a warning from your antivirus, it's a false positive.

* if you're on **macOS**, open the DMG and move the app in your `Applications` folder, then run it. If it says that the app is damaged or can't be opened, [follow Method 4 from this guide](https://osxdaily.com/2019/02/13/fix-app-damaged-cant-be-opened-trash-error-mac/).
  
* if you're on **Linux**, either install from the `.deb` or `.AppImage`, the run it as per your distro.

## Known bugs

* the app doesn't restart automatically on Windows
* if a room set to favorite changes name or no longer exists, there is no way to remove it and hide it from the Profile page

If a bug you found isn't here, [open an issue](https://github.com/nanoseb12/HRN-Client/issues)!

## Features in detail

### 👤 User Profiles

User profiles let you set up different player identities that you can switch between easily. This is useful if you play on different maps, in rooms that all require a separate registration, or just to keep things organized. It saves you from the hassle of using multiple browsers, incognito tabs, or constantly clearing browser data just to manage separate HaxBall “accounts”.

Each profile has its own

* nickname
* avatar
* auth (your "identity")
* extrapolation
* location override
* list of favorite rooms.
  
You can manage profiles by clicking in the **top-right corner**, where there's a user icon with "**Default**" next to it. The **Default** profile can't be deleted and is automatically updated if you change your nickname, extrapolation, or any of the other attributes listed above. It's like your standard browser experience. When you click on it, you'll be able to create new profiles (there is no limit), switch to a different one, or delete those you no longer need. 

### 📷 Camera zoom

Use the camera slider in **Ajustes de Haxracing** to scale the game view from 0.10× to 2.00×. This Electron zoom makes more of the track visible at lower values, and also scales the chat and HUD.

### ⚡️ Unlimited FPS

The app allows unlocking the game's framerate. Just click on **Settings**, on the header, and then set the corresponding option to **Unlimited**. You will need to restart the app afterwards!

⚠ Note that this feature may not work flawlessly for everyone. It is still under testing.

### 💬 Shortcuts

Shortcuts let you type frequent commands or messages by automatically expanding a specific text written in chat.

The app comes with two pre-configured shortcuts:

* `/e`, which expands to `/extrapolation `
* `/a`, which expands to `/avatar `

as well as shortcuts for all emojis (such as `:smile:` to get 😀).

You can set as many shortcuts as you like!

### 🔐 Player Auth management

Player Auth is a persistent HaxBall identity, not a login for this client. Some rooms use it to recognize players and retain permissions or statistics. In **Settings**, you can view, change, or reset it. Never share your private key; changing identities can make rooms recognize you as a different player.

To restore an identity from another browser or device, visit [HaxBall Player Auth](https://haxball.com/playerauth) and import its **Private Key**.

If instead you are using an old version of the client, type `auth` in the command bar and copy the **Private Key**.

## How to build

Clone this repository. Next, run

```sh
npm install
```

to install all dependencies. For local development, compile the injected UI and launch the desktop client with:

```sh
npm run build:ts
npm start
```

To package the client, run the build command for your OS, as specified in `package.json`.

For instance, for the Windows 64bit version, run

```sh
npm run build:win-x64
```

