export type BotProfile = {
  name: string;
  personality: string;
}

export type ServerSideBotProfile = BotProfile & {
  conversing: boolean;
  coding: boolean;
  saving_memory: boolean;
}
