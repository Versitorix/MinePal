import { VoiceMode } from './voice';
import { OpenAIModel } from './openAi';

export type UserSettings = {
  minecraft_version: string;
  host: string;
  port: number;
  player_username: string;
  whisper_to_player: boolean;
  voice_mode: VoiceMode;
  key_binding: string;
  language: string;
  openai_api_key?: string;
  model: OpenAIModel;
  useOwnApiKey: boolean;
  use_own_deepgram_api_key: boolean;
  deepgram_api_key?: string;
};

export type ServerSideUserSettings = UserSettings & {
  auth: "offline" | "online";
  allow_insecure_coding: boolean;
  code_timeout_mins: number;
  load_memory: boolean;
};
