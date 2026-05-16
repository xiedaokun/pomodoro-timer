const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  globalShortcut,
} = require("electron");
const path = require("path");

let mainWindow;
let tray;
let alwaysOnTop = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");

  // 关闭时隐藏到托盘
  mainWindow.on("close", (e) => {
    if (app.isQuitting) return;
    e.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  // 创建一个简约的托盘图标（16x16 红色圆点）
  const size = 16;
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="8" cy="8" r="7" fill="#FF3B30"/>
      </svg>`,
      "utf-8"
    )
  );

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  const contextMenu = Menu.buildFromTemplate([
    { label: "显示窗口", click: () => mainWindow.show() },
    {
      label: "始终置顶",
      type: "checkbox",
      checked: alwaysOnTop,
      click: (item) => {
        alwaysOnTop = item.checked;
        mainWindow.setAlwaysOnTop(alwaysOnTop);
      },
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip("Pomodoro");
  tray.setContextMenu(contextMenu);
  tray.on("click", () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

// ── IPC ──────────────────────────────────────────
ipcMain.on("window-minimize", () => mainWindow.minimize());
ipcMain.on("window-hide", () => mainWindow.hide());
ipcMain.on("window-close", () => {
  app.isQuitting = true;
  app.quit();
});

ipcMain.handle("toggle-always-on-top", () => {
  alwaysOnTop = !alwaysOnTop;
  mainWindow.setAlwaysOnTop(alwaysOnTop);
  return alwaysOnTop;
});

ipcMain.on("update-title", (_e, title) => {
  if (mainWindow) mainWindow.setTitle(title);
});
