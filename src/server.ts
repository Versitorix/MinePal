import { app, IpcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import net from 'net';
import { HTTPS_BACKEND_URL } from './constants.mjs';
import { AgentProcess } from './process/agent-process';
import { UserSettings } from './types/userSettings';
import { BotProfile, ServerSideBotProfile } from './types/botProfile';
import { getUserSettings, updateUserSettings } from './utils/userSettings';
import { getProfiles, updateProfiles } from './utils/profiles';
import logToFile from './utils/logToFile';

const userDataDir = app.getPath('userData');

let agentsStarted = false;
let agentProcesses: AgentProcess[] = [];

/* function setupVoice(settings: UserSettings) {
  voice_mode = settings.voice_mode; // Assign voice_mode from settings
  const { key_binding } = settings;

  if ((voice_mode === 'push_to_talk' || voice_mode === 'toggle_to_talk') && key_binding) {
    gkl = new GlobalKeyboardListener();

    gkl.addListener((e) => {
      if (e.name?.toLowerCase() === key_binding.toLowerCase()) {
        if (e.state === 'DOWN') {
          if (voice_mode === 'push_to_talk') {
            isKeyDown = true;
            console.log('Push-to-talk key down:', isKeyDown);
          } else if (voice_mode === 'toggle_to_talk') {
            isToggleToTalkActive = !isToggleToTalkActive;
            console.log('Toggle-to-talk active:', isToggleToTalkActive);
          }
        } else if (e.state === 'UP' && voice_mode === 'push_to_talk') {
          isKeyDown = false;
          console.log('Push-to-talk key up:', isKeyDown);
        }
      }
    });
  }
}

function startServer() {
  logToFile("Starting server...");
  if (!userDataDir || !fs.existsSync(userDataDir)) {
    throw new Error("userDataDir must be provided and must exist");
  }

  let settings: ServerSideUserSettings;
  let transcriptBuffer = "";

  wss.on("connection", (ws) => {
    logToFile("socket: client connected");
    // Update settings
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    voice_mode = settings.voice_mode;
    const deepgramClient: DeepgramFacade = settings.use_own_deepgram_api_key && settings.deepgram_api_key ? new DeepgramLocal(settings) : new DeepgramProxy(settings);
    setupVoice(settings);

    deepgramClient.on('connect', () => {
      logToFile(`proxy: connected to ${WSS_BACKEND_URL}`);
    });

    deepgramClient.on('transcript', (data) => {
      // console.log(`Voice Mode: ${settings.voice_mode}, isKeyDown: ${isKeyDown}, isToggleToTalkActive: ${isToggleToTalkActive}`);
      if (voice_mode === 'always_on' ||
        (voice_mode === 'push_to_talk' && isKeyDown) ||
        (voice_mode === 'toggle_to_talk' && isToggleToTalkActive)) {

        const { is_final, speech_final, transcript } = data || {};

        if (is_final) {
          transcriptBuffer += transcript;
        }

        if (speech_final) {
          ws.send(transcriptBuffer); // to frontend
          agentProcesses.forEach(agentProcess => {
            agentProcess.sendTranscription(transcriptBuffer);
          });
          transcriptBuffer = "";
        }
      } else {
        ws.send("Voice Disabled");
      }
    });

    deepgramClient.on('close', () => {
      logToFile(`proxy: connection to ${WSS_BACKEND_URL} closed`);
      ws.close();
    });

    deepgramClient.on('error', (error) => {
      logToFile(`proxy: error ${error}`);
      ws.close();
    });

    ws.on("message", (message, isBinary) => {
      if (isBinary) {
        deepgramClient.send(message);
      } else {
        logToFile(`WebSocket - received wacky weird data that isn't binary: ${message}`);
      }
    });

    ws.on("close", () => {
      logToFile("socket: client disconnected");
      deepgramClient.close();
    });

    deepgramClient.connect();
  });
} */

async function proxyAlive() {
  try {
    const response = await fetch(`${HTTPS_BACKEND_URL}/ping`);

    if (response.ok && await response.text() === 'pong') {
      return true;
    }

    return false;
  } catch (error: unknown) {
    if (error instanceof Error) {
      logToFile(`Heartbeat error: ${error.message}`);
    } else {
      logToFile(`Heartbeat error: ${error}`);
    }
    return false;
  }
}

async function appGetSettings(): Promise<UserSettings> {
  const {
    allow_insecure_coding: _,
    code_timeout_mins: __,
    auth: ___,
    load_memory: ____,
    ...settings
  } = await getUserSettings();

  return settings;
}

async function appSaveSettings(_: Electron.IpcMainInvokeEvent, settings: UserSettings) {
  await updateUserSettings({
    ...settings,
    // removed from UI, hardcoding these settings
    allow_insecure_coding: false,
    code_timeout_mins: 10,
    auth: "offline",
    load_memory: true,
  });
}

async function appGetProfiles(): Promise<BotProfile[]> {
  const profiles = await getProfiles();

  return profiles.map((profile) => ({
    name: profile.name,
    personality: profile.personality,
  }))
}

async function appSaveProfiles(_: Electron.IpcMainInvokeEvent, profiles: BotProfile[]) {
  const defaultData: ServerSideBotProfile = JSON.parse(await fs.readFile(path.join(app.getAppPath(), 'ethan.json'), 'utf8'));

  const serverProfiles = profiles.map((profile): ServerSideBotProfile => ({
    ...defaultData,
    ...profile,
  }));

  await updateProfiles(serverProfiles);
}

async function botStart(event: Electron.IpcMainInvokeEvent, profiles: BotProfile[]) {
  logToFile('IPC: Bot start called');

  if (agentsStarted) {
    logToFile('IPC: Agent process already started');
    return false;
  }

  const settings = await getUserSettings();

  for (const profile of profiles) {
    const profileBotName = profile.name;
    const agentProcess = new AgentProcess(() => {
      logToFile("Bot was kicked");
      event.sender.send("bot:kicked", "Error: Bot kicked.");
    });
    agentProcess.start(profileBotName, userDataDir, settings.useOwnApiKey, settings.openai_api_key, settings.load_memory);
    agentProcesses.push(agentProcess);
  }
  agentsStarted = true;
  logToFile('IPC: AgentProcess started for all profiles');
  return true
}

async function botStop() {
  logToFile('IPC: Bot stop called');

  if (!agentsStarted) {
    logToFile('IPC: No agent processes running');
    return false;
  }

  agentProcesses.forEach(agentProcess => {
    agentProcess.agentProcess?.kill();
  });

  agentProcesses = [];
  agentsStarted = false;

  logToFile('IPC: All agent processes stopped');
  return true;
}

async function botManualChat(_: Electron.IpcMainInvokeEvent, botName: string, message: string) {
  const process = agentProcesses.find(agentProcess => agentProcess.botName === botName);

  if (process) {
    process.sendMessage(message)
    return true
  }

  return false;
}

async function minecraftAlive(_: Electron.IpcMainInvokeEvent, host: string, port: number) {
  const socket = new net.Socket();

  socket.setTimeout(2000); // Set a timeout for the connection

  try {
    await new Promise<void>((resolve, reject) => {
      socket.on('connect', () => {
        logToFile(`Server at ${host}:${port} is reachable.`);
        socket.destroy();
        resolve()
      }).on('error', (err) => {
        logToFile(`Server at ${host}:${port} is not reachable. Error: ${err.message}`);
        reject(err.message);
      }).on('timeout', () => {
        logToFile(`Server at ${host}:${port} is not reachable. Error: Timeout`);
        socket.destroy();
        reject("Timeout");
      }).connect({
        port: typeof port === "string" ? Number.parseInt(port) : 25565,
        host: typeof host === "string" ? host : "127.0.0.1"
      });
    });
    return true;
  } catch {
    return false
  }
}

export function registerHandlers(ipcMain: IpcMain) {
  ipcMain.handle("app:getSettings", appGetSettings);
  ipcMain.handle("app:saveSettings", appSaveSettings);
  ipcMain.handle("app:getProfiles", appGetProfiles);
  ipcMain.handle("app:saveProfiles", appSaveProfiles);
  ipcMain.handle("bot:start", botStart);
  ipcMain.handle("bot:stop", botStop);
  ipcMain.handle("bot:manualChat", botManualChat);
  ipcMain.handle("proxy:alive", proxyAlive);
  ipcMain.handle("minecraft:alive", minecraftAlive);
}
