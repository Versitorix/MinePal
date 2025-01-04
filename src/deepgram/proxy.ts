import { RawData, WebSocket } from "ws";
import DeepgramFacade from "./DeepgramFacade";
import { WSS_BACKEND_URL } from "../constants";

export default class DeepgramProxy extends DeepgramFacade {
  private proxyWebSocket?: WebSocket;

  connect(): void {
    if (this.proxyWebSocket) return;

    this.proxyWebSocket = new WebSocket(`${WSS_BACKEND_URL}?language=${this.language}`);

    this.proxyWebSocket.on('open', () => {
      this.dispatch("connect");
    });

    this.proxyWebSocket.on('message', (message) => {
      const parsedMessage = JSON.parse(message.toString('utf8'));
      this.dispatch("transcript", parsedMessage);
    });

    this.proxyWebSocket.on('close', () => {
      this.close();
    });

    this.proxyWebSocket.on('error', (error) => {
      this.dispatch("error", error);
    });
  }

  send(data: RawData): void {
    throw new Error("Method not implemented.");
  }

  close(): void {
    this.proxyWebSocket?.close();
    this.proxyWebSocket = undefined;

    this.dispatch("close");
  }

}
