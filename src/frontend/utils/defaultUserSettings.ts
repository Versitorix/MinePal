import { UserSettings } from "../../types/userSettings";

const defaultUserSettings: UserSettings = {
  minecraft_version: "",
  host: "",
  port: 0,
  player_username: "",
  whisper_to_player: false,
  voice_mode: "always_on",
  key_binding: '',
  language: 'en',
  openai_api_key: '',
  model: "gpt-4o-mini",
  useOwnApiKey: false,
  use_own_deepgram_api_key: false,
};

export default defaultUserSettings;
