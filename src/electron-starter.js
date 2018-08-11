const { app, BrowserWindow, ipcMain } = require("electron");
const iohook = require("iohook");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ width: 400, height: 600 });

  const startUrl =
    process.env.ELECTRON_START_URL ||
    url.format({
      pathname: path.join(__dirname, "/../build/index.html"),
      protocol: "file:",
      slashes: true
    });
  mainWindow.loadURL(startUrl);

  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", function() {
    mainWindow = null;
  });

  iohook.start();
  iohook.on("keydown", event => {
    mainWindow.webContents.send("keydown", event);
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function() {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on("before-quit", () => {
  ioHook.unload();
  ioHook.stop();
});
