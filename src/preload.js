const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getApiConfig: () => ipcRenderer.invoke('get-api-config'),
  saveApiConfig: (config) => ipcRenderer.invoke('save-api-config', config),
  sendMessage: (data) => ipcRenderer.invoke('send-message', data),
  onNewChat: (callback) => ipcRenderer.on('new-chat', callback),
  onOpenSettings: (callback) => ipcRenderer.on('open-settings', callback)
});
