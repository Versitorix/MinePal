import { createContext, useContext } from "react";
import { BotProfile } from "../../../types/botProfile";

type AgentContextType = {
  agentActive: boolean;
  start: () => Promise<void> | void;
  stop: () => Promise<void> | void;
  selectedProfiles: BotProfile[],
  toggleProfile: (profile: BotProfile) => void;
}

const DEFAULT_AGENT_CONTEXT: AgentContextType = {
  agentActive: false,
  selectedProfiles: [],
  start: () => { },
  stop: () => { },
  toggleProfile: () => { },
};

export const AgentContext = createContext(DEFAULT_AGENT_CONTEXT);

export function useAgent() {
  return useContext(AgentContext);
}

