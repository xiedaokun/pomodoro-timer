const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  minimize: () => ipcRenderer.send("window-minimize"),
  hide: () => ipcRenderer.send("window-hide"),
  close: () => ipcRenderer.send("window-close"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("toggle-always-on-top"),
  updateTitle: (title) => ipcRenderer.send("update-title", title),
});
