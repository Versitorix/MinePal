import "./Actions.css";
import { useAgent } from "../../contexts/AgentContext/AgentContext";
import AudioActions from "./AudioActions";

function Actions() {
  const { agentActive, start, stop } = useAgent();

  const toggleAgent = () => {
    if (!agentActive) {
      start();
    } else {
      stop();
    }
  }

  return (
    <div className="actions">
      <AudioActions />
      <button className="action-button" onClick={toggleAgent}>
        {agentActive ? "Stop Bot" : "Start Bot"}
      </button>
    </div >
  );
}

export default Actions;
