/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
/**
 * BroadSoft Extensions Integration Test Demo
 *
 * This demo demonstrates the integration of BroadSoft Access-Side Extensions
 * with FreeSWITCH, including:
 * 1. Auto-Answer (Call-Info header with answer-after parameter)
 * 2. Remote Control - Talk Events (mute/unmute via NOTIFY)
 */

import { Invitation } from "../lib/api/invitation.js";
import { Notification } from "../lib/api/notification.js";
import { Registerer } from "../lib/api/registerer.js";
import { RegistererState } from "../lib/api/registerer-state.js";
import { UserAgent } from "../lib/api/user-agent.js";
import { UserAgentOptions } from "../lib/api/user-agent-options.js";
import {
  SessionDescriptionHandler,
  defaultSessionDescriptionHandlerFactory
} from "../lib/platform/web/session-description-handler/index.js";
import * as BroadSoft from "../lib/api/broadsoft/index.js";

// DOM Elements (will be initialized after DOM loads)
let serverInput: HTMLInputElement;
let userInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let domainInput: HTMLInputElement;

let connectButton: HTMLButtonElement;
let disconnectButton: HTMLButtonElement;
let answerButton: HTMLButtonElement;
let hangupButton: HTMLButtonElement;

let connectionStatus: HTMLSpanElement;
let remoteAudio: HTMLAudioElement;
let localAudio: HTMLAudioElement;

let muteCheckbox: HTMLInputElement;

// BroadSoft Status Elements
let autoAnswerEnabled: HTMLSpanElement;
let autoAnswerDelay: HTMLSpanElement;
let autoAnswerCountdown: HTMLSpanElement;
let autoAnswerStatus: HTMLSpanElement;

let talkEvent: HTMLSpanElement;
let talkStatus: HTMLSpanElement;

let eventLog: HTMLDivElement;
let clearLogButton: HTMLButtonElement;

// State
let userAgent: UserAgent | undefined;
let registerer: Registerer | undefined;
let currentSession: Invitation | undefined;
let autoAnswerTimer: number | undefined;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Initialize DOM elements
  serverInput = document.getElementById("server") as HTMLInputElement;
  userInput = document.getElementById("user") as HTMLInputElement;
  passwordInput = document.getElementById("password") as HTMLInputElement;
  domainInput = document.getElementById("domain") as HTMLInputElement;

  connectButton = document.getElementById("connect") as HTMLButtonElement;
  disconnectButton = document.getElementById("disconnect") as HTMLButtonElement;
  answerButton = document.getElementById("answer") as HTMLButtonElement;
  hangupButton = document.getElementById("hangup") as HTMLButtonElement;

  connectionStatus = document.getElementById("connection-status") as HTMLSpanElement;
  remoteAudio = document.getElementById("remoteAudio") as HTMLAudioElement;
  localAudio = document.getElementById("localAudio") as HTMLAudioElement;

  muteCheckbox = document.getElementById("mute") as HTMLInputElement;

  autoAnswerEnabled = document.getElementById("auto-answer-enabled") as HTMLSpanElement;
  autoAnswerDelay = document.getElementById("auto-answer-delay") as HTMLSpanElement;
  autoAnswerCountdown = document.getElementById("auto-answer-countdown") as HTMLSpanElement;
  autoAnswerStatus = document.getElementById("auto-answer-status") as HTMLSpanElement;

  talkEvent = document.getElementById("talk-event") as HTMLSpanElement;
  talkStatus = document.getElementById("talk-status") as HTMLSpanElement;

  eventLog = document.getElementById("event-log") as HTMLDivElement;
  clearLogButton = document.getElementById("clear-log") as HTMLButtonElement;

  // Setup event listeners
  connectButton.addEventListener("click", connect);
  disconnectButton.addEventListener("click", disconnect);
  answerButton.addEventListener("click", answerCall);
  hangupButton.addEventListener("click", hangupCall);
  muteCheckbox.addEventListener("change", toggleMute);
  clearLogButton.addEventListener("click", clearLog);

  log("Demo loaded. Configure settings and click Connect.", "info");
});

// Logging
function log(message: string, type: "info" | "success" | "warning" | "error" = "info"): void {
  const timestamp = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.className = `log-entry ${type}`;
  entry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span><span class="log-message">${message}</span>`;
  eventLog.appendChild(entry);
  eventLog.scrollTop = eventLog.scrollHeight;
  console.log(`[${timestamp}] ${message}`);
}

function clearLog(): void {
  eventLog.innerHTML = "";
  log("Log cleared.", "info");
}

// Connection
async function connect(): Promise<void> {
  const server = serverInput.value;
  const user = userInput.value;
  const password = passwordInput.value;
  const domain = domainInput.value;

  if (!server || !user || !password || !domain) {
    log("Please fill in all configuration fields.", "error");
    return;
  }

  log(`Connecting to ${server} as ${user}@${domain}...`, "info");
  updateConnectionStatus("connecting");

  const uri = UserAgent.makeURI(`sip:${user}@${domain}`);
  if (!uri) {
    log("Invalid SIP URI", "error");
    updateConnectionStatus("disconnected");
    return;
  }

  const options: UserAgentOptions = {
    uri,
    transportOptions: {
      server
    },
    authorizationUsername: user,
    authorizationPassword: password,
    sessionDescriptionHandlerFactory: defaultSessionDescriptionHandlerFactory(),
    delegate: {
      onInvite: (invitation: Invitation) => {
        handleIncomingCall(invitation);
      }
    }
  };

  try {
    userAgent = new UserAgent(options);
    userAgent.start().then(() => {
      log("WebSocket connected, registering...", "info");
      updateConnectionStatus("connecting");

      // Create Registerer
      registerer = new Registerer(userAgent as UserAgent);

      // Listen for registration state changes
      registerer.stateChange.addListener((state: RegistererState) => {
        log(`Registration state: ${state}`, "info");
        if (state === RegistererState.Registered) {
          log("✓ Registered successfully! Ready to receive calls.", "success");
          updateConnectionStatus("connected");
          connectButton.disabled = true;
          disconnectButton.disabled = false;
        } else if (state === RegistererState.Unregistered) {
          log("Unregistered", "warning");
        } else if (state === RegistererState.Terminated) {
          log("Registration terminated", "error");
          updateConnectionStatus("disconnected");
        }
      });

      // Send REGISTER
      registerer.register().catch((error) => {
        log(`Registration failed: ${error}`, "error");
        updateConnectionStatus("disconnected");
      });
    });
  } catch (error) {
    log(`Connection failed: ${error}`, "error");
    updateConnectionStatus("disconnected");
  }
}

async function disconnect(): Promise<void> {
  // Unregister first
  if (registerer && registerer.state === RegistererState.Registered) {
    log("Unregistering...", "info");
    try {
      await registerer.unregister();
      log("Unregistered successfully", "success");
    } catch (error) {
      log(`Failed to unregister: ${error}`, "warning");
    }
  }

  // Then stop user agent
  if (userAgent) {
    log("Disconnecting...", "info");
    await userAgent.stop();
    userAgent = undefined;
    registerer = undefined;
    updateConnectionStatus("disconnected");
    connectButton.disabled = false;
    disconnectButton.disabled = true;
    log("Disconnected.", "success");
  }
}

function updateConnectionStatus(status: "disconnected" | "connecting" | "connected"): void {
  connectionStatus.className = `status-${status}`;
  connectionStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

// Call Handling
function handleIncomingCall(invitation: Invitation): void {
  log("📞 Incoming call received", "info");
  currentSession = invitation;

  // Setup session delegate for remote control FIRST (before any NOTIFY arrives)
  log("🔧 Setting up session delegate for remote control", "info");
  setupSessionDelegate(invitation);
  log("✅ Session delegate setup complete", "info");

  // Check for auto-answer
  const shouldAutoAns = BroadSoft.shouldAutoAnswer(invitation);
  const delay = BroadSoft.getAutoAnswerDelay(invitation.request);

  autoAnswerEnabled.textContent = shouldAutoAns ? "✓ Yes" : "✗ No";
  autoAnswerDelay.textContent = delay !== undefined ? `${delay} seconds` : "N/A";

  if (shouldAutoAns && delay !== undefined) {
    log(`🤖 Auto-answer enabled with ${delay}s delay`, "success");
    autoAnswerStatus.textContent = "Auto-answering...";
    startAutoAnswerCountdown(delay);

    // Configure auto-answer options
    const autoAnswerOptions: BroadSoft.AutoAnswerOptions = {
      enabled: true,
      onBeforeAutoAnswer: (delaySeconds) => {
        log(`Auto-answer will trigger in ${delaySeconds} seconds`, "info");
      },
      onAfterAutoAnswer: () => {
        log("✓ Call auto-answered!", "success");
        autoAnswerStatus.textContent = "Answered automatically";
        stopAutoAnswerCountdown();
      }
    };

    // Handle auto-answer
    BroadSoft.handleAutoAnswer(invitation, autoAnswerOptions);
  } else {
    log("Manual answer required. Click 'Answer Call' button.", "warning");
    autoAnswerStatus.textContent = "Waiting for manual answer...";
    answerButton.disabled = false;
  }

  // Setup session state listener
  invitation.stateChange.addListener((state: string) => {
    log(`Session state: ${state}`, "info");
    if (state === "Established") {
      onCallEstablished();
    } else if (state === "Terminated") {
      onCallTerminated();
    }
  });
}

function setupSessionDelegate(session: Invitation): void {
  // Per BroadSoft spec, remote control NOTIFY automatically triggers SIP signaling:
  // - Event: talk → Answers ringing call or resumes from hold (sends 200 OK or re-INVITE)
  // These callbacks are for UI updates only
  const remoteControlOptions: BroadSoft.RemoteControlOptions = {
    enabled: true,
    onTalkEvent: (action) => {
      log(`🎤 Remote Control - Talk Event: ${action}`, "warning");
      talkEvent.textContent = action;
      if (action === BroadSoft.TalkAction.Mute) {
        talkStatus.textContent = "Muted (by remote)";
        talkStatus.style.color = "#e74c3c";
        muteCheckbox.checked = true;
      } else {
        talkStatus.textContent = "Active (call will be answered/resumed automatically)";
        talkStatus.style.color = "#27ae60";
        muteCheckbox.checked = false;
      }
    }
  };

  session.delegate = {
    onNotify: (notification: Notification) => {
      log("📨 NOTIFY received", "info");

      const isBroadSoft = BroadSoft.isBroadSoftNotification(notification);

      if (isBroadSoft) {
        log("✓ BroadSoft remote control NOTIFY detected", "success");
        const eventType = BroadSoft.parseEventHeaderFromNotification(notification);
        log(`Event type: ${eventType}`, "info");

        BroadSoft.handleRemoteControlNotification(session, notification, remoteControlOptions)
          .then(() => {
            log("Remote control action applied", "success");
          })
          .catch((error) => {
            log(`Error handling remote control: ${error}`, "error");
          });

        notification.accept();
      } else {
        log("Non-BroadSoft NOTIFY, accepting", "info");
        notification.accept();
      }
    }
  };
}

function startAutoAnswerCountdown(seconds: number): void {
  let remaining = seconds;
  autoAnswerCountdown.textContent = `${remaining}s`;

  autoAnswerTimer = window.setInterval(() => {
    remaining--;
    if (remaining >= 0) {
      autoAnswerCountdown.textContent = `${remaining}s`;
    } else {
      stopAutoAnswerCountdown();
    }
  }, 1000);
}

function stopAutoAnswerCountdown(): void {
  if (autoAnswerTimer) {
    clearInterval(autoAnswerTimer);
    autoAnswerTimer = undefined;
  }
  autoAnswerCountdown.textContent = "-";
}

async function answerCall(): Promise<void> {
  if (currentSession && currentSession.state === "Initial") {
    log("Answering call manually...", "info");
    try {
      await currentSession.accept();
      log("✓ Call answered", "success");
      answerButton.disabled = true;
    } catch (error) {
      log(`Failed to answer call: ${error}`, "error");
    }
  }
}

async function hangupCall(): Promise<void> {
  if (currentSession) {
    log("Hanging up call...", "info");
    try {
      await currentSession.bye();
      log("✓ Call hung up", "success");
    } catch (error) {
      log(`Failed to hang up: ${error}`, "error");
    }
  }
}

function onCallEstablished(): void {
  log("✓ Call established", "success");
  answerButton.disabled = true;
  hangupButton.disabled = false;
  muteCheckbox.disabled = false;

  // Setup audio
  if (currentSession && currentSession.sessionDescriptionHandler) {
    const sdh = currentSession.sessionDescriptionHandler as SessionDescriptionHandler;

    // Remote audio
    const remoteStream = sdh.remoteMediaStream;
    if (remoteStream) {
      remoteAudio.srcObject = remoteStream;
      remoteAudio.play().catch((e) => log(`Error playing audio: ${e}`, "error"));
    }

    // Local audio (muted for monitoring)
    const localStream = sdh.localMediaStream;
    if (localStream) {
      localAudio.srcObject = localStream;
    }
  }
}

function onCallTerminated(): void {
  log("Call terminated", "info");
  currentSession = undefined;
  answerButton.disabled = true;
  hangupButton.disabled = true;
  muteCheckbox.disabled = true;
  muteCheckbox.checked = false;

  // Reset BroadSoft status
  autoAnswerEnabled.textContent = "-";
  autoAnswerDelay.textContent = "-";
  autoAnswerCountdown.textContent = "-";
  autoAnswerStatus.textContent = "Waiting for call...";
  talkEvent.textContent = "None";
  talkStatus.textContent = "Active";
  talkStatus.style.color = "#27ae60";

  stopAutoAnswerCountdown();

  // Clear audio
  remoteAudio.srcObject = null;
  localAudio.srcObject = null;
}

// Manual Controls
async function toggleMute(): Promise<void> {
  if (currentSession && currentSession.sessionDescriptionHandler) {
    const sdh = currentSession.sessionDescriptionHandler as SessionDescriptionHandler;
    const localStream = sdh.localMediaStream;
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (muteCheckbox.checked) {
        log("🎤 Muting microphone (manual)", "info");
        audioTracks.forEach((track) => (track.enabled = false));
        talkStatus.textContent = "Muted (manual)";
        talkStatus.style.color = "#f39c12";
      } else {
        log("🎤 Unmuting microphone (manual)", "info");
        audioTracks.forEach((track) => (track.enabled = true));
        talkStatus.textContent = "Active";
        talkStatus.style.color = "#27ae60";
      }
    }
  }
}
