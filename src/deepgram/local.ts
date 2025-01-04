import { createClient, DeepgramClient, ListenLiveClient, LiveTranscriptionEvents, SOCKET_STATES } from '@deepgram/sdk';
import { RawData, WebSocket } from 'ws';
import DeepgramFacade from './DeepgramFacade';

export default class DeepgramLocal extends DeepgramFacade {
    private deepgramClient: DeepgramClient;
    private deepgramLiveClient?: ListenLiveClient;
    private keepAliveInterval?: NodeJS.Timeout;

    constructor(settings: { deepgram_api_key?: string, language: string }) {
        super(settings);
        this.deepgramClient = createClient(this.deepgramAPIKey);
    }

    connect(): void {
        if (this.deepgramLiveClient) return;

        this.deepgramLiveClient = this.deepgramClient.listen.live({
            language: this.language || 'en',  // Use the provided language or default to 'en'
            punctuate: true,
            smart_format: true,
            model: "nova-2",
            endpointing: 20,
        });

        this.keepAliveInterval = setInterval(() => {
            this.deepgramLiveClient!.keepAlive();
        }, 10 * 1000);

        this.deepgramLiveClient!.addListener(LiveTranscriptionEvents.Open, async () => {
            console.log("deepgram: connected");

            this.deepgramLiveClient!.addListener(LiveTranscriptionEvents.Transcript, (data) => {
                const jsonData = {
                    is_final: data.is_final,
                    speech_final: data.speech_final,
                    transcript: data.channel.alternatives[0].transcript
                };
                this.dispatch("transcript", jsonData);
            });

            this.deepgramLiveClient!.addListener(LiveTranscriptionEvents.Close, async () => {
                console.log("deepgram: disconnected");
                this.close();
            });

            this.deepgramLiveClient!.addListener(LiveTranscriptionEvents.Error, async (error) => {
                console.log("deepgram: error received");
                this.dispatch("error", error);
            });

            /* this.deepgramLiveClient!.addListener(LiveTranscriptionEvents.Metadata, (data) => {
                ws.sendUTF(JSON.stringify({ metadata: data }));
            }); */

            this.dispatch("connect");
        });
    }

    send(data: RawData): void {
        if (!this.deepgramLiveClient) {
            console.log("socket: data couldn't be sent to deepgram");
            return;
        } else if (this.deepgramLiveClient.getReadyState() !== SOCKET_STATES.open) {
            return
        }

        this.deepgramLiveClient.send(new Blob(Array.isArray(data) ? data : [data]));
    }

    close(): void {
        this.deepgramLiveClient
            ?.removeAllListeners()
            .requestClose();
        this.deepgramLiveClient = undefined;
        clearInterval(this.keepAliveInterval);

        this.dispatch("close");
    }
}
