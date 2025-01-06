// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron';
import { UserSettings } from './types/userSettings';
import { BotProfile } from './types/botProfile';

contextBridge.exposeInMainWorld('app', {
  getSettings: (): Promise<UserSettings> => ipcRenderer.invoke('app:getSettings'),
  saveSettings: (settings: UserSettings): Promise<void> => ipcRenderer.invoke('app:saveSettings', settings),
  getProfiles: (): Promise<BotProfile[]> => ipcRenderer.invoke('app:getProfiles'),
  saveProfiles: (profiles: BotProfile[]): Promise<void> => ipcRenderer.invoke('app:saveProfiles', profiles),
});

contextBridge.exposeInMainWorld('bot', {
  start: (profiles: BotProfile[]): Promise<boolean> => ipcRenderer.invoke('bot:start', profiles),
  stop: (): Promise<boolean> => ipcRenderer.invoke('bot:stop'),
  manualChat: (botName: string, message: string): Promise<boolean> => ipcRenderer.invoke('bot:manualChat', botName, message),
});

contextBridge.exposeInMainWorld('proxy', {
  alive: (): Promise<boolean> => ipcRenderer.invoke('proxy:alive'),
});

contextBridge.exposeInMainWorld('minecraft', {
  alive: (host: string, port: number): Promise<boolean> => ipcRenderer.invoke('minecraft:alive', host, port),
});
