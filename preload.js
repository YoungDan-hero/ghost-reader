const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openNovel: () => ipcRenderer.invoke('open-novel'),
  loadByPath: (p) => ipcRenderer.invoke('load-novel-by-path', p),
  getState: () => ipcRenderer.invoke('get-state'),
  saveProgress: (data) => ipcRenderer.send('save-progress', data),
  removeBook: (p) => ipcRenderer.invoke('remove-book', p),
  quit: () => ipcRenderer.send('quit-app'),
  minimize: () => ipcRenderer.send('minimize-app'),
  onToggleState: (cb) => ipcRenderer.on('toggle-state', cb),
  onForceDisguise: (cb) => ipcRenderer.on('force-disguise', cb),
});
