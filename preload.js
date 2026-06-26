const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  platform: process.platform, // 'darwin' | 'win32' | 'linux'
  openNovel: () => ipcRenderer.invoke('open-novel'),
  loadByPath: (p) => ipcRenderer.invoke('load-novel-by-path', p),
  getState: () => ipcRenderer.invoke('get-state'),
  saveProgress: (data) => ipcRenderer.send('save-progress', data),
  removeBook: (p) => ipcRenderer.invoke('remove-book', p),
  quit: () => ipcRenderer.send('quit-app'),
  minimize: () => ipcRenderer.send('minimize-app'),
  setGhost: (on) => ipcRenderer.send('set-ghost', on),
  pickColor: () => ipcRenderer.invoke('pick-color'),
  onToggleState: (cb) => ipcRenderer.on('toggle-state', cb),
  onForceDisguise: (cb) => ipcRenderer.on('force-disguise', cb),
  onPickColorNow: (cb) => ipcRenderer.on('pick-color-now', cb),
});
