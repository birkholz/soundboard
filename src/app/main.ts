// This is the main process entry point. It is the
// first file that is run on startup.
//
// It is responsible for launching a renderer window.

import { app } from "electron";
import * as isDev from "electron-is-dev";
import * as log from "electron-log";
import { createUpdater } from "../electron/lib/updater";
import { createMainWindow } from "../electron/main-window";
import { createMenu } from "../electron/menu";

// set proper logging level
log.transports.file.level = isDev ? false : "info";
log.transports.console.level = isDev ? "debug" : false;

let window: Electron.BrowserWindow;

// usually we'd just use __dirname here, however, the FuseBox
// bundler rewrites that, so we have to get it from Electron.
const appPath = app.getAppPath();

// fires when Electron is ready to start
app.on("ready", () => {
  window = createMainWindow(appPath);
  createMenu(window);

  if (isDev) {
    window.webContents.openDevTools();
  }
});

// fires when all windows are closed
app.on("window-all-closed", app.quit);

// setup the auto-updater
createUpdater(app);
