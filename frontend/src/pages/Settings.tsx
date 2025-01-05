export default function Settings() {
  return (
    <div>

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
      <div className="notice" style={{ color: '#666666', fontSize: '0.9em', marginTop: '5px' }}>
        Voice chat temporarily disabled due to high server loads
      </div>
      <div className="api-key-settings">
        <label className="api-key-checkbox">
          <input
            type="checkbox"
            checked={userSettings.useOwnApiKey || false}
            onChange={handleUseOwnApiKeyChange}
            disabled={agentActive}
          />
          Use your own API Key
        </label>

        {userSettings.useOwnApiKey && (
          <div className="api-key-controls">
            <div className="api-key-input-group">
              <label htmlFor="api-key">OpenAI API Key:</label>
              <input
                type="password"
                id="api-key"
                value={userSettings.openai_api_key || ''}
                onChange={handleApiKeyChange}
                placeholder="Enter your OpenAI API key"
                disabled={agentActive}
                className="api-key-input"
              />
            </div>
            <div className="model-select-group">
              <label htmlFor="model">Model:</label>
              <select
                id="model"
                value={userSettings.model || 'gpt-4o-mini'}
                onChange={handleModelChange}
                disabled={agentActive}
                className="model-select"
              >
                {openAIModels.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
