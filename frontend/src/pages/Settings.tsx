import { ChevronLeft } from "react-feather";
import { useAgent } from "../contexts/AgentContext/AgentContext";
import Link from "../contexts/RouterContext/Link";
import { useUserSettings } from "../contexts/UserSettingsContext/UserSettingsContext";
import openAIModels from "../utils/openAIModels";
import supportedLocales from "../utils/supportedLocales";

export default function Settings() {
  const { agentActive } = useAgent();
  const { userSettings, updateField } = useUserSettings();

  const handleLanguageChange = ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
    updateField("language", value);
  };

  const handleUseOwnApiKeyChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
    updateField("useOwnApiKey", checked);
  };

  const handleApiKeyChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
    updateField("openai_api_key", value);
  };

  const handleModelChange = ({ target: { value } }: React.ChangeEvent<HTMLSelectElement>) => {
    updateField("model", value);
  };

  const handleUseDeepgramApiKeyChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
    updateField("use_own_deepgram_api_key", value);
  };

  const handleDeepgramApiKeyChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) => {
    updateField("deepgram_api_key", value);
  };

  return (
    <div className="container">
      <div className="header">
        <Link href="/"><ChevronLeft />Back</Link>
        <h1>Settings</h1>
      </div>
      <div className="api-key-settings">
        <h2>Language</h2>
        <div className="language-settings">
          <label htmlFor="language">Language/Accent:</label>
          <select
            id="language"
            value={userSettings.language}
            onChange={handleLanguageChange}
            disabled={agentActive}
          >
            {supportedLocales.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="api-key-settings">
        <h2>OpenAI</h2>
        <label className="api-key-checkbox">
          <input
            type="checkbox"
            checked={userSettings.useOwnApiKey || false}
            onChange={handleUseOwnApiKeyChange}
            disabled={agentActive}
          />
          Use own API Key
        </label>
        <div className="api-key-controls">
          <div className="api-key-input-group">
            <label htmlFor="api-key">OpenAI API Key:</label>
            <input
              type="password"
              id="api-key"
              value={userSettings.openai_api_key || ''}
              onChange={handleApiKeyChange}
              placeholder="Enter your OpenAI API key"
              disabled={agentActive || !userSettings.useOwnApiKey}
              className="api-key-input"
            />
          </div>
          <div className="model-select-group">
            <label htmlFor="model">Model:</label>
            <select
              id="model"
              value={userSettings.model || 'gpt-4o-mini'}
              onChange={handleModelChange}
              disabled={agentActive || !userSettings.useOwnApiKey}
              className="model-select"
            >
              {openAIModels.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="api-key-settings">
        <h2>Deepgram</h2>
        <label className="api-key-checkbox">
          <input
            type="checkbox"
            checked={userSettings.use_own_deepgram_api_key || false}
            onChange={handleUseDeepgramApiKeyChange}
            disabled={agentActive}
          />
          Use own API Key
        </label>
        <div className="api-key-controls">
          <div className="api-key-input-group">
            <label htmlFor="deepgram-api-key">API Key:</label>
            <input
              type="password"
              id="deepgram-api-key"
              value={userSettings.deepgram_api_key || ''}
              onChange={handleDeepgramApiKeyChange}
              placeholder="Enter your DeepGram API key"
              disabled={agentActive || !userSettings.use_own_deepgram_api_key}
              className="api-key-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
