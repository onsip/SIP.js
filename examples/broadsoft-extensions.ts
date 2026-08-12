/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable tree-shaking/no-side-effects-in-initialization */
/**
 * BroadSoft Access-Side Extensions Example
 *
 * This example demonstrates how to use the two common BroadSoft Access-Side extensions:
 * 1. Call-Info: ...; answer-after=1 - Auto-Answer
 * 2. NOTIFY (Event: talk) - Remote Control Event for answering/resuming calls
 */

import { BroadSoft, Invitation, UserAgent, UserAgentOptions, Web } from "../src/api/index.js";

// Configure UserAgent
const userAgentOptions: UserAgentOptions = {
  uri: UserAgent.makeURI("sip:alice@example.com"),
  transportOptions: {
    server: "wss://sip.example.com"
  },
  // Use Web platform for SessionDescriptionHandler
  sessionDescriptionHandlerFactory: Web.SessionDescriptionHandler.defaultFactory
};

const userAgent = new UserAgent(userAgentOptions);

// Configure BroadSoft auto-answer options
const autoAnswerOptions: BroadSoft.AutoAnswerOptions = {
  enabled: true,
  onBeforeAutoAnswer: (delaySeconds) => {
    console.log(`Auto-answering incoming call in ${delaySeconds} seconds...`);
  },
  onAfterAutoAnswer: () => {
    console.log("Call auto-answered successfully");
  }
  // Optional: override the delay from the header
  // delayOverride: 0  // Always answer immediately
};

// Configure BroadSoft remote control options
// Per BroadSoft spec, remote control NOTIFY automatically triggers SIP signaling:
// - Event: talk → Answers ringing call or resumes from hold (sends 200 OK or re-INVITE)
// Callbacks are for UI updates only
const remoteControlOptions: BroadSoft.RemoteControlOptions = {
  enabled: true,
  onTalkEvent: (action) => {
    console.log(`Remote control - Talk event: ${action}`);
    if (action === BroadSoft.TalkAction.Talk) {
      console.log("Call will be answered/resumed automatically");
      // Update UI to show active call state
    }
  }
};

// Set up UserAgent delegate to handle incoming invitations
userAgent.delegate = {
  onInvite: (invitation: Invitation) => {
    console.log("Incoming call received");

    // Check if this call should be auto-answered
    const shouldAutoAnswer = BroadSoft.shouldAutoAnswer(invitation);
    const autoAnswerDelay = BroadSoft.getAutoAnswerDelay(invitation.request);

    if (shouldAutoAnswer) {
      console.log(`Call has auto-answer enabled (delay: ${autoAnswerDelay}s)`);
      // Handle auto-answer
      BroadSoft.handleAutoAnswer(invitation, autoAnswerOptions);
    } else {
      console.log("Call does not have auto-answer, waiting for user action");
      // You can manually answer later with: invitation.accept()
    }

    // Set up session delegate to handle NOTIFY requests
    invitation.delegate = {
      onNotify: (notification) => {
        console.log("NOTIFY received");

        // Check if this is a BroadSoft remote control NOTIFY
        const isBroadSoft = BroadSoft.isBroadSoftNotification(notification);

        if (isBroadSoft) {
          console.log("BroadSoft remote control NOTIFY detected");
          // Handle the remote control NOTIFY
          BroadSoft.handleRemoteControlNotification(invitation, notification, remoteControlOptions).catch((error) => {
            console.error("Error handling remote control NOTIFY:", error);
          });

          // Accept the NOTIFY
          notification.accept();
        } else {
          console.log("Non-BroadSoft NOTIFY, handling normally");
          // Handle other NOTIFY types
          notification.accept();
        }
      }
    };

    // Set up state change handlers
    invitation.stateChange.addListener((state) => {
      console.log(`Session state changed to: ${state}`);
    });
  }
};

// Start the UserAgent
userAgent
  .start()
  .then(() => {
    console.log("UserAgent started and ready to receive calls");
  })
  .catch((error) => {
    console.error("Failed to start UserAgent:", error);
  });

// Example: Parsing Call-Info headers manually
function examineCallInfoHeaders(invitation: Invitation): void {
  const callInfoHeaders = BroadSoft.extractCallInfoHeaders(invitation.request);

  console.log(`Found ${callInfoHeaders.length} Call-Info header(s)`);

  for (const header of callInfoHeaders) {
    console.log(`  URI: ${header.uri}`);
    console.log(`  Parameters:`, header.params);

    if (header.params.answerAfter !== undefined) {
      console.log(`  Auto-answer delay: ${header.params.answerAfter} seconds`);
    }
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down...");
  userAgent
    .stop()
    .then(() => {
      console.log("UserAgent stopped");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error stopping UserAgent:", error);
      process.exit(1);
    });
});
