import { UserSettings } from '../../types/userSettings';
import { BotProfile } from '../../types/botProfile';

export async function fetchBackendAlive() {
  const alive = await window.proxy.alive();

  return alive;
}

export async function checkServerAlive(host: string, port: number) {
  const alive = await window.minecraft.alive(host, port);

  return alive;
}

export async function getSettings() {
  const settings = await window.app.getSettings();

  return settings;
}

export async function saveSettings(newSettings: UserSettings) {
  await window.app.saveSettings(newSettings);
}

export function sendMessage(botName: string, message: string) {
  return window.bot.manualChat(botName, message);
}

export async function getProfiles() {
  const profiles = await window.app.getProfiles();

  return profiles;
}

export async function saveProfiles(profiles: BotProfile[]) {
  await window.app.saveProfiles(profiles);
}

export async function startAgent(profilesToUse: BotProfile[]): Promise<boolean> {
  const started = await window.bot.start(profilesToUse);

  return started;
}

export async function stopAgent(): Promise<boolean> {
  const stopped = await window.bot.stop();

  return stopped;
}

export async function getAnnouncements(): Promise<string> {
  const response = await fetch('https://minepal.net/announcement.txt');
  const data = await response.text();

  return data;
}
