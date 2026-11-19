const { app, shell, BrowserWindow, ipcMain, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');
const { z } = require('zod');
const { version } = require('./package.json');
const { generateKeyPairSync, randomBytes } = require('crypto');
const http = require('http');
const https = require('https');
const DiscordRPC = require ("discord-rpc");

let win;
const rpcClientId = "1391027232352501841";
const discordOAuthClientId = "1572737824070041620";
const discordOAuthRedirectUri = "http://127.0.0.1:43127/callback";
const rpc = new DiscordRPC.Client({ transport: 'ipc' });
rpc.on('ready', () => {
	console.log('Discord RPC ready');
});


const validatePreferences = (prefs) => {
  const ProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    autosave: z.boolean(),
    avatar: z.string().nullable(),
    extrapolation: z.string().nullable(),
    fav_rooms: z.array(z.string()),
    geo_override: z.object({
      lat: z.number(),
      lon: z.number(),
      code: z.string()
    }).nullable(),
    player_auth_key: z.string().nullable(),
    player_name: z.string().nullable()
  });

  const PreferencesSchema = z.object({
      fps_unlock: z.boolean(),
      notes: z.array(z.object({
        title: z.string(),
        body: z.string(),
        time: z.string()
      })), 
      transp_ui: z.boolean(),
      language: z.enum(['en', 'es', 'pt']).optional(),
      shortcuts: z.array(z.tuple([z.string(), z.string()])),
      profiles: z.array(ProfileSchema),
      discord_rpc: z.boolean().optional(),
      discord_account: z.object({
        id: z.string(),
        username: z.string(),
        avatarUrl: z.string().url(),
        linkedAt: z.string()
      }).nullable().optional(),
      camera_zoom: z.number().min(0.1).max(2).optional()
  });

  try {
    PreferencesSchema.parse(prefs);
  } catch (err) {
    console.error('Failed to validate preferences:', err);
}

}

const saveAppPreferences = (prefs) => {
  const userDatapath = app.getPath('userData')
  const preferencesPath = path.join(userDatapath, 'preferences.json')
  try {
    fs.writeFileSync(preferencesPath, JSON.stringify(prefs, null, 2));
  } catch (error) {
    console.error('Error saving app preferences:', error);
  }
}

const requestDiscordJson = (url, options = {}) => new Promise((resolve, reject) => {
  const request = https.request(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
  }, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => {
      try {
        resolve({ status: response.statusCode || 0, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) });
      } catch (error) {
        reject(error);
      }
    });
  });
  request.on('error', reject);
  request.setTimeout(15000, () => request.destroy(new Error('Discord request timed out.')));
  if (options.body) request.write(options.body);
  request.end();
});

const loadAppPreferences = () => {
  const userDataPath = app.getPath('userData')
  const preferencesPath = path.join(userDataPath, 'preferences.json')
  const preferencesDefaultPath = path.join(__dirname, 'inject', 'preferences_default.json')
  try {
    if (fs.existsSync(preferencesPath)) {
      const fileContent = fs.readFileSync(preferencesPath, 'utf-8');
      const data = JSON.parse(fileContent)
      validatePreferences(data)
      return data;
    } else {
      // File doesn't exist, return and save default settings
      const fileContent = fs.readFileSync(preferencesDefaultPath, 'utf8')
      const data = JSON.parse(fileContent)
      validatePreferences(data)
      saveAppPreferences(data)
      return data;
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
    app.quit();
    return {};
  }
}

const preferences = loadAppPreferences();
if (preferences.fps_unlock) {
  app.commandLine.appendSwitch('disable-frame-rate-limit');
  console.log("FPS unlocked")
}
// app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
// app.commandLine.appendSwitch('enable-gpu-rasterization');
// app.commandLine.appendSwitch('force-gpu-rasterization');


const createWindow = () => {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.bounds;

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 1024,
    minHeight: 720,
    show: false, // start hidden
    fullscreen: false,
    fullscreenable: true,
    titleBarStyle: "default",
    autoHideMenuBar: true,
    kiosk: false,
    frame: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false
    },
    title: "HRN Client · Haxracing"
  });
  
  const extensionPath = path.join(path.dirname(__dirname), 'app.asar.unpacked', 'inject', 'Haxball-Room-Extension');
  win.webContents.session.loadExtension(extensionPath);
  win.webContents.setZoomFactor(Number(preferences.camera_zoom) || 1);

  win.loadURL('https://www.haxball.com/play');

  win.webContents.on('did-finish-load', () => {
    const injectJS = fs.readFileSync(path.join(__dirname, 'inject', 'inject.js'), 'utf8');
    // const injectCSS = fs.readFileSync(path.join(__dirname, 'inject', 'inject.css'), 'utf8');

    // win.webContents.executeJavaScript(`
    //   const style = document.createElement('style');
    //   style.textContent = \`${injectCSS}\`;
    //   document.head.appendChild(style);
    // `);

    win.webContents.executeJavaScript(injectJS);
  });

  // unlimited FPS workaround for newer electron versions
  // win.webContents.on('did-frame-finish-load', () => {
  //   if (!win.webContents.debugger.isAttached()) {
  //     try {
  //       win.webContents.debugger.attach('1.3');
  //     } catch (err) {
  //       console.error('Debugger attach failed:', err);
  //       return;
  //     }
  //   }

  //   if (preferences.fps_unlock){
  //     win.webContents.debugger.sendCommand('Emulation.setCPUThrottlingRate', {
  //       rate: 9
  //     }).then(() => {
  //       console.log('Throttling enabled');
  //     }).catch(err => {
  //       console.error('Failed to set throttling rate:', err);
  //     });
  //   }
  // })


  // Handle in-app navigation (e.g., <a href="..."> clicks)
  win.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    // const isInternal = parsedUrl.hostname.endsWith('haxball.com');

    const allowed = url.includes('haxball.com') || url.startsWith('https://github.com/oghb/haxball-client/releases/download');

    if (!allowed) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle window.open or target="_blank"
  win.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    const isInternal = parsedUrl.hostname.endsWith('haxball.com');

    if (isInternal & url !== "https://haxball.com/playerauth") {
      createWindow(url);
    } else {
      shell.openExternal(url);
    }

    return { action: 'deny' }; // We handle both cases manually
  });

  // make sure the app closes even if player in a room
  win.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault();
  });
  win.on('close', (e) => {
    mainWindow = null;
  });

  return win;
}

ipcMain.handle('set-app-preference', async (event, key, value) => {
  // console.log('Received preference:', key, value);
  const prefs = loadAppPreferences();
  prefs[key] = value;
  saveAppPreferences(prefs);
});

ipcMain.handle('set-camera-zoom', async (event, value) => {
  const factor = Number(value);
  if (!Number.isFinite(factor) || factor < 0.1 || factor > 2) {
    throw new Error('Camera zoom must be between 0.1 and 2.0.');
  }
  const prefs = loadAppPreferences();
  prefs.camera_zoom = factor;
  saveAppPreferences(prefs);
  event.sender.setZoomFactor(factor);
  return factor;
});

ipcMain.handle('get-app-preferences', async () => {
  return loadAppPreferences();
});

ipcMain.on('restart-app', () => {
  console.log('Restarting app...');
  // app.relaunch();
  app.relaunch({
    execPath: process.execPath,
    args: process.argv.slice(1).concat(['--relaunch'])
  });
  app.exit(0);
});

ipcMain.on('ready-to-show', () => {
  win.show();
});

ipcMain.handle('save-preferences-file', async () => {
  const userDataPath = app.getPath('userData')
  const preferencesPath = path.join(userDataPath, 'preferences.json')
  const now = +new Date()

  const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: `preferences_${now}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (!canceled && filePath) {
      const content = await fs.promises.readFile(preferencesPath, 'utf-8');
      await fs.promises.writeFile(filePath, content);
      return { success: true };
  }
  return { succes: false };
});


ipcMain.handle('import-preferences-file', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Preferences JSON',
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) {
      return { success: false, error: 'No file selected.' };
  }

  try {
      const filePath = filePaths[0];
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // console.log(data)

      // Validate the data
      validatePreferences(data);

      // Save it to the Electron user data folder
      const userDataPath = app.getPath('userData');
      const preferencesPath = path.join(userDataPath, 'preferences.json');

      fs.writeFileSync(preferencesPath, JSON.stringify(data, null, 2), 'utf-8');

      return { success: true };
  } catch (err) {
      console.error('Failed to import preferences:', err);
      return { success: false, error: err.errors || err.message || 'Invalid JSON file.' };
  }
});

ipcMain.handle('delete-preferences-file', async (event) => {
  const userDataPath = app.getPath('userData')
  const preferencesPath = path.join(userDataPath, 'preferences.json')
  try {
    if (fs.existsSync(preferencesPath)) {
      fs.rmSync(preferencesPath);
      return { success: true }
    }
  } catch (error) {
    console.error('Error deleting preferences:', error);
    return { success: false };
  }
})

ipcMain.handle('get-app-version', async (event) => {
  return version
})

ipcMain.handle('generate-player-auth-key', async (event) => {
  const { privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: { format: 'jwk' },
    privateKeyEncoding: { format: 'jwk' },
  });

  const idkey = `idkey.${privateKey.x}.${privateKey.y}.${privateKey.d}`;

  return idkey
})

ipcMain.handle('connect-discord-account', async () => {
  const state = randomBytes(24).toString('hex');

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, profile) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (server.listening) server.close();
      if (error) reject(error);
      else resolve(profile);
    };
    const server = http.createServer(async (request, response) => {
      if (request.method === 'GET' && request.url?.split('?')[0] === '/callback') {
        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; style-src 'unsafe-inline'",
        }).end(`<!doctype html><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>HRN - Discord</title><main style="font:16px sans-serif;margin:3em auto;max-width:36em"><h2 id="title">Conectando Discord con HRN…</h2><p id="message">Puedes cerrar esta pestaña cuando termine.</p></main><script>
          (async () => {
            const params = new URLSearchParams(location.hash.slice(1));
            const payload = {
              accessToken: params.get('access_token'),
              state: params.get('state'),
              issuer: params.get('iss'),
              error: params.get('error_description') || params.get('error')
            };
            history.replaceState(null, '', location.pathname);
            try {
              const result = await fetch('/oauth-callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
              const data = await result.json();
              if (!result.ok) throw new Error(data.error || 'No se pudo validar la autorización.');
              document.getElementById('title').textContent = 'Discord conectado';
              document.getElementById('message').textContent = 'Vuelve a HRN Client. Ya puedes cerrar esta pestaña.';
            } catch (error) {
              document.getElementById('title').textContent = 'No se pudo conectar Discord';
              document.getElementById('message').textContent = error.message;
            }
          })();
        </script>`);
        return;
      }
      if (request.method !== 'POST' || request.url !== '/oauth-callback') {
        response.writeHead(404).end('Not found');
        return;
      }
      try {
        let rawBody = '';
        for await (const chunk of request) {
          rawBody += chunk;
          if (rawBody.length > 8192) throw new Error('La respuesta de Discord excede el tamaño permitido.');
        }
        const authResult = JSON.parse(rawBody);
        if (authResult.state !== state) throw new Error('Discord OAuth state mismatch');
        if (authResult.issuer !== 'https://discord.com') throw new Error('Unexpected Discord OAuth issuer');
        if (authResult.error) throw new Error(String(authResult.error));
        if (typeof authResult.accessToken !== 'string' || authResult.accessToken.length > 8192) {
          throw new Error('Discord no devolvió un token de acceso válido.');
        }
        const profileResponse = await requestDiscordJson('https://discord.com/api/v10/users/@me', {
          headers: { Authorization: `Bearer ${authResult.accessToken}` },
        });
        if (profileResponse.status < 200 || profileResponse.status >= 300 || !profileResponse.data?.id) {
          throw new Error('Discord no pudo validar el perfil autorizado.');
        }
        const user = profileResponse.data;
        const avatarUrl = user.avatar
          ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
          : `https://cdn.discordapp.com/embed/avatars/${Number(user.discriminator || 0) % 6}.png`;
        const profile = {
          id: user.id,
          username: String(user.global_name || user.username || 'Discord'),
          avatarUrl,
          linkedAt: new Date().toISOString(),
        };
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ success: true }));
        finish(null, profile);
      } catch (error) {
        response.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ error: error instanceof Error ? error.message : 'Error de autorización.' }));
        finish(error);
      }
    });

    const timeout = setTimeout(() => finish(new Error('Se agotó el tiempo para conectar Discord.')), 180000);
    server.on('error', error => finish(error));
    server.listen(43127, '127.0.0.1', () => {
      const authorizeUrl = new URL('https://discord.com/oauth2/authorize');
      authorizeUrl.search = new URLSearchParams({
        client_id: discordOAuthClientId,
        response_type: 'token',
        redirect_uri: discordOAuthRedirectUri,
        scope: 'identify',
        state,
      }).toString();
      shell.openExternal(authorizeUrl.toString()).catch(error => finish(error));
    });
  });
});

ipcMain.on('update-discord-rpc', (_event, details) => {
  const activity = {
    details: details,
    largeImageKey: 'client-logo',
    largeImageText: 'HRN Client · Haxracing',
    startTimestamp: Date.now(),
    buttons: [
      {
          label: 'Download Client',
          url:'https://oghb.github.io/haxball-client/'
      },
      {
          label: 'Join Discord',
          url:'https://discord.gg/zDzYamtcfX'
      }
    ]
  }

  rpc.setActivity(activity).catch((err) => {
    console.error('Discord RPC Error: Not logged in');
  });
});

app.whenReady().then(() => {
  win = createWindow();

  const preferencesPath = path.join(app.getPath('userData'), 'preferences.json')
  const fileContent = fs.readFileSync(preferencesPath, 'utf-8');
  const data = JSON.parse(fileContent);

  const enableRPC = data["discord_rpc"] ?? true;

  if (enableRPC){
    rpc.login({ clientId: rpcClientId });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
