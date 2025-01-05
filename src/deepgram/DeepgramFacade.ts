import { RawData, WebSocket } from "ws";

type DeepgramFacadeEvents = "close" | "connect" | "transcript" | "error";
type Callback<T = unknown> = (args?: T) => Promise<void> | void;

export type DeepgramTranscriptData = {
  is_final: boolean;
  speech_final?: string;
  transcript?: string;
}

export default abstract class DeepgramFacade {
  private listeners: Record<DeepgramFacadeEvents, Callback[]>;

  protected deepgramAPIKey?: string
  protected language: string

  constructor(settings: { deepgram_api_key?: string, language: string }) {
    this.deepgramAPIKey = settings.deepgram_api_key;
    this.language = settings.language;
    this.listeners = {
      close: [],
      connect: [],
      error: [],
      transcript: [],
    };
  }

  abstract connect(): void;
  abstract send(data: RawData): void;
  abstract close(): void;

  protected dispatch(eventType: "transcript", data: DeepgramTranscriptData): Promise<void>
  protected dispatch(eventType: "connect"): Promise<void>
  protected dispatch(eventType: "close"): Promise<void>
  protected dispatch(eventType: "error", error: Error): Promise<void>
  protected async dispatch(eventType: DeepgramFacadeEvents, ...args: unknown[]) {
    if (this.listeners[eventType]) {
      await Promise.all(this.listeners[eventType].map((callback) => callback(...args)));
    }
  }

  on(eventType: "transcript", callback: Callback<DeepgramTranscriptData>): Callback<DeepgramTranscriptData>
  on(eventType: "connect", callback: Callback<void>): Callback<void>
  on(eventType: "close", callback: Callback<void>): Callback<void>
  on(eventType: "error", callback: Callback<Error>): Callback<Error>
  on(eventType: DeepgramFacadeEvents, callback: Callback<any>): Callback<any> {
    this.listeners[eventType].push(callback);
    return callback
  }

  off(eventType: DeepgramFacadeEvents, callback: Callback): void {
    if (!this.listeners[eventType]) {
      return
    }

    this.listeners[eventType] = this.listeners[eventType].filter((listener) => listener !== callback);
  }
}
