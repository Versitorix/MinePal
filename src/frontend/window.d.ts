import { UserSettings } from '../types/userSettings';
import { BotProfile } from '../types/botProfile';

declare global {
  interface Window {
    app: {
      getSettings: () => Promise<UserSettings>;
      saveSettings: (settings: UserSettings) => Promise<void>;
      getProfiles: () => Promise<BotProfile[]>;
      saveProfiles: (profiles: BotProfile[]) => Promise<void>;
    };
    bot: {
      start: (profiles: BotProfile[]) => Promise<boolean>;
      stop: () => Promise<boolean>;
      manualChat: (botName: string, message: string) => Promise<boolean>;
    };
    proxy: {
      alive: () => Promise<boolean>;
    };
    minecraft: {
      alive: (host: string, port: number) => Promise<boolean>;
    };
    voice: {
      start: () => Promise<boolean>;
      stop: () => Promise<boolean>;
      voiceChunk: (chunk: ArrayBuffer) => Promise<void>;
    };
  }
}

export { };
