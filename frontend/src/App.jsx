import { useState, useEffect } from 'react';
import axios from 'axios';
import mixpanel from 'mixpanel-browser';
import './App.css';
import Settings from './components/Settings';
import Actions from './components/Actions';
import Transcription from './components/Transcription';

mixpanel.init('a9bdd5c85dab5761be032f1c1650defa');

const api = axios.create({
  baseURL: LOCAL_BE_HOST
});

function App() {
  const [settings, setSettings] = useState({
    minecraft_version: "",
    host: "",
    port: "",
    player_username: "",
    auth: "",
    profiles: [],
    load_memory: false,
    init_message: "",
    allow_insecure_coding: false,
    code_timeout_mins: "",
  });

  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [socket, setSocket] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [agentStarted, setAgentStarted] = useState(false);
  const [newProfile, setNewProfile] = useState("");

  const [loading, setLoading] = useState(true);

  const [startTime, setStartTime] = useState(null);

  const addProfile = () => {
    if (newProfile.trim() !== "") {
      setSettings(prev => ({
        ...prev,
        profiles: [...prev.profiles, newProfile.trim()]
      }));
      setNewProfile("");
    }
  };

  const removeProfile = (index) => {
    setSettings(prev => ({
      ...prev,
      profiles: prev.profiles.filter((_, i) => i !== index)
    }));
  };

  const settingNotes = {
    minecraft_version: "supports up to 1.20.4",
    host: "or \"localhost\", \"your.ip.address.here\"",
    port: "default is 25565",
    player_username: "your Minecraft username",
    auth: "or \"microsoft\"",
    profiles: "add more profiles here, check ./profiles/ for more. More than 1 profile will require you to /msg each bot individually",
    load_memory: "load memory from previous session",
    init_message: "sends to all on spawn",
    allow_insecure_coding: "disable at own risk",
    code_timeout_mins: "-1 for no timeout",
  }

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      const expectedFields = Object.keys(settings);
      const filteredSettings = Object.fromEntries(
        Object.entries(response.data).filter(([key]) => expectedFields.includes(key))
      );
      setSettings(prevSettings => ({ ...prevSettings, ...filteredSettings }));
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError("Failed to load settings.");
      throw err;
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const response = await api.get('/agent-status');
      setAgentStarted(response.data.agentStarted);
    } catch (err) {
      console.error("Failed to fetch agent status:", err);
      setError("Failed to load agent status.");
      throw err;
    }
  };

  const fetchBackendAlive = async () => {
    try {
      const response = await api.get('/backend-alive');
      if (!response.data.backend_alive) {
        throw new Error("Backend is down.");
      }
    } catch (err) {
      console.error("Failed to check backend status:", err);
      setError(`Failed to check backend status: ${err.message}`);
      throw err;
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const checkServerAlive = async (host, port) => {
    try {
        const response = await api.get('/check-server', { params: { host, port } });
        return response.data.alive;
    } catch (error) {
        console.error("Server ping failed:", error);
        return false;
    }
  };

  const toggleAgent = async () => {
    if (agentStarted) {
      try {
        const response = await api.post('/stop', {});
        console.log("Agent stopped successfully:", response.data);
        setAgentStarted(false);
        setError(null); // Clear errors on success
        if (isRecording) {
          await toggleMic(); // Ensure microphone and WebSocket are shut down
        }

        // Track the "Bot play time" event
        if (startTime) {
          const playTime = (Date.now() - startTime) / 1000; // in seconds
          mixpanel.track('Bot play time', {
            distinct_id: settings.player_username,
            play_time: playTime
          });
          setStartTime(null);
        }
      } catch (error) {
        console.error("Failed to stop agent:", error);
        setError(error.response?.data || error.message || "An unknown error occurred while stopping the agent.");
      }
    } else {
      const emptyFields = Object.entries(settings)
        .filter(([key, value]) => {
          if (key === 'profiles') return value.length === 0;
          if (typeof value === 'string') return value.trim() === '';
          if (Array.isArray(value)) return value.length === 0;
          return value === null || value === undefined;
        })
        .map(([key]) => key);

      if (emptyFields.length > 0) {
        setError(`Please fill in the following fields: ${emptyFields.join(', ')}`);
        return;
      }

      const serverAlive = await checkServerAlive(settings.host, settings.port);
      if (!serverAlive) {
        setError("The Minecraft server is not reachable. Please check the host and port.");
        return;
      }

      try {
        const response = await api.post('/start', settings);
        console.log("Agent started successfully:", response.data);
        setAgentStarted(true);
        setError(null); // Clear errors on success

        // Identify the user in Mixpanel
        mixpanel.identify(settings.player_username);

        // Set the start time for tracking
        setStartTime(Date.now());
      } catch (error) {
        console.error("Failed to start agent:", error);
        setError(error.response?.data || error.message || "An unknown error occurred while starting the agent.");
      }
    }
  };

  const getMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return new MediaRecorder(stream);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  };

  const openMicrophone = async (mic, sock) => {
    return new Promise((resolve) => {
      mic.onstart = () => {
        console.log("Microphone started");
        setIsRecording(true);
        resolve();
      };

      mic.onstop = () => {
        console.log("Microphone stopped");
        setIsRecording(false);
      };

      mic.ondataavailable = (event) => {
        if (event.data.size > 0 && sock.readyState === WebSocket.OPEN) {
          sock.send(event.data);
        }
      };

      mic.start(1000);
    });
  };

  const closeMicrophone = async (mic) => {
    if (mic && mic.state !== "inactive") {
      mic.stop();
    }
  };

  const toggleMic = async () => {
    if (!agentStarted && !isRecording) {
      setError("Please start the agent first.");
      return;
    }

    if (isRecording) {
      await closeMicrophone(microphone);
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setMicrophone(null);
      setIsRecording(false);
    } else {
      const wsUrl = api.defaults.baseURL.replace(/^http/, 'ws');
      const newSocket = new WebSocket(`${wsUrl}`);
      setSocket(newSocket);

      newSocket.addEventListener("open", async () => {
        console.log("WebSocket connection opened");
        try {
          const mic = await getMicrophone();
          setMicrophone(mic);
          await openMicrophone(mic, newSocket);
        } catch (error) {
          console.error("Error opening microphone:", error);
          setError("Failed to start recording. Please check your microphone permissions.");
        }
      });

      newSocket.addEventListener("message", (event) => {
        const transcript = event.data.toString('utf8');
        if (transcript !== "") {
          setTranscription(transcript);
        }
      });

      newSocket.addEventListener("close", () => {
        console.log("WebSocket connection closed");
        setIsRecording(false);
      });
    }
  };

  useEffect(() => {
    const fetchDataWithRetry = async () => {
      const startTime = Date.now();
      const timeoutDuration = 5000;

      while (Date.now() - startTime < timeoutDuration) {
        try {
          await fetchSettings();
          await fetchAgentStatus();
          await fetchBackendAlive();
          setError(null);
          break; // Exit loop if all fetches succeed
        } catch (err) {
          console.error("Fetch failed, retrying...", err);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retrying
        }
      }

      setLoading(false);
    };

    fetchDataWithRetry();
  }, []);

  if (loading) {
    return <div className="spinner">Loading...</div>;
  }

  return (
    <div className="container">
      <h1>Minepal Control Panel</h1>
      <Settings
        {...{
          settings,
          handleSettingChange,
          settingNotes,
          showAdvanced,
          setShowAdvanced,
          newProfile,
          setNewProfile,
          addProfile,
          removeProfile
        }}
      />
      <Actions
        agentStarted={agentStarted}
        toggleAgent={toggleAgent}
        isRecording={isRecording}
        toggleMic={toggleMic}
      />
      {error && <div className="error-message">{error}</div>}
      <Transcription transcription={transcription} />
    </div>
  );
}

export default App;