import "./Actions.css";
import { useAgent } from "../../contexts/AgentContext/AgentContext";
import AudioActions from "./AudioActions";
import { useUserSettings } from "../../contexts/UserSettingsContext/UserSettingsContext";

function Actions() {
  const { agentActive, start, stop } = useAgent();
  const { userSettings: { use_own_deepgram_api_key } } = useUserSettings();

  const toggleAgent = () => {
    if (!agentActive) {
      start();
    } else {
      stop();
    }
  }

  return (
    <div className="actions">
      {use_own_deepgram_api_key
        ? <AudioActions />
        : (
          <div className="notice" style={{ color: '#666666', fontSize: '0.9em', marginTop: '5px' }}>
            Voice chat temporarily disabled due to high server loads. Use your own Deepgram API key to use voice.
          </div>
        )}
      <button className="action-button" onClick={toggleAgent}>
        {agentActive ? "Stop Bot" : "Start Bot"}
      </button>
    </div >
  );
}

export default Actions;
