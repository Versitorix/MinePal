import { app } from "electron";
import fs from 'fs/promises';

import { ServerSideUserSettings } from "../types/userSettings";

const settingsPath = `${app.getPath('userData')}/settings.json`;

export async function getUserSettings(): Promise<ServerSideUserSettings> {
  if (!(await fs.stat(settingsPath)).isFile()) {
    return {
      minecraft_version: "1.20.4",
      host: "localhost",
      port: 25565,
      auth: "offline",
      player_username: "",
      load_memory: true,
      allow_insecure_coding: false,
      code_timeout_mins: 10,
      whisper_to_player: false,
      voice_mode: "always_on",
      key_binding: "",
      openai_api_key: "",
      model: "gpt-4o-mini",
      language: "en",
      useOwnApiKey: false,
      use_own_deepgram_api_key: false,
    };
  }

  return JSON.parse(await fs.readFile(settingsPath, 'utf8'));
}

export async function updateUserSettings(updatedSettings: ServerSideUserSettings) {
  return fs.writeFile(settingsPath, JSON.stringify(updatedSettings, null, 4));
}
