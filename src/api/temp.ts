import { OutgoingInviteRequest } from "../core";

import {
  Inviter,
  InviterOptions,
  Referral,
  RegistererOptions,
  RegistererState,
  Session,
  SessionDescriptionHandler,
  SessionDescriptionHandlerOptions,
  SessionState,
  UserAgent,
  UserAgentOptions
} from ".";
import { Invitation } from "./invitation";
import { InviterInviteOptions } from "./inviter-invite-options";
import { Registerer } from "./registerer";

// tslint:disable:no-console

/*
 * Create a user agent
 */

const userAgentOptions = { /* ... */ };
const userAgent = new UserAgent(userAgentOptions);

/*
 * Setup handling for incoming INVITE requests
 */

userAgent.delegate = {
  onInvite(invitation: Invitation): void {

    // An Invitation is a Session
    const incomingSession: Session = invitation;

    // Setup incoming session delegate
    incomingSession.delegate = {
      // Handle incoming REFER request.
      onRefer(referral: Referral): void {
        // ...
      }
    };

    // Handle incoming session state changes.
    incomingSession.stateChange.on((newState: SessionState) => {
      switch (newState) {
        case SessionState.Establishing:
          // Session is establishing.
          break;
        case SessionState.Established:
          // Session has been established.
          break;
        case SessionState.Terminated:
          // Session has terminated.
          break;
        default:
          break;
      }
    });
  }
};

/*
 * Start user agent
 */
userAgent.start().then(() => {

  /*
   * Register the user agent
   */

  const registererOptions: RegistererOptions = {/* ... */ };
  const registerer = new Registerer(userAgent, registererOptions);

  // Send the REGISTER request
  registerer.register();

  /*
   * Send an outgoing INVITE request
   */

  // Create a target URI
  const target = UserAgent.makeURI("sip:alice@example.com");
  if (!target) {
    throw new Error("Failed to create target URI.");
  }

  // Create a new inviter
  const inviterOptions: InviterOptions = {/* ... */ };
  const inviter = new Inviter(userAgent, target, inviterOptions);

  // An Inviter is a Session
  const outgoingSession: Session = inviter;

  // Setup outgoing session delegate
  outgoingSession.delegate = {
    // Handle incoming REFER request.
    onRefer(referral: Referral): void {
      // ...
    }
  };

  // Handle outgoing session state changes.
  outgoingSession.stateChange.on((newState: SessionState) => {
    switch (newState) {
      case SessionState.Establishing:
        // Session is establishing.
        break;
      case SessionState.Established:
        // Session has been established.
        break;
      case SessionState.Terminated:
        // Session has terminated.
        break;
      default:
        break;
    }
  });

  // Send the INVITE request
  inviter.invite()
    .then(() => {
      // INVITE sent
    })
    .catch((error: Error) => {
      // INVITE did not send
    });

  inviter.invite({
    requestDelegate: {
      onProgress: (response) => {
        const statusCode =  response.message.statusCode;
        /* is it a 183... */
      }
    }
  });

});

const uri = UserAgent.makeURI("sip:alice@example.com");
if (!uri) {
  throw new Error("");
}
const options = {
  authenticationUsername: "username",
  authenticationPassword: "password",
  uri
};

// const userAgent = new UserAgent(options);

const registerer1 = new Registerer(userAgent);

// Setup registerer state change handler
registerer1.stateChange.on((newState) => {
  switch (newState) {
    case RegistererState.Registered:
      console.log("Registered");
      break;
    case RegistererState.Unregistered:
      console.log("Unregistered");
      break;
  }
});

// Send REGISTER
registerer1.register()
  .then((request) => {
    console.log("Successfully sent REGISTER");
    console.log("REGISTER request = " + request);
  })
  .catch((error) => {
    console.log("Failed to send REGISTER");
  });

const registered = registerer1.state === RegistererState.Registered;

registerer1.unregister();

// Target URI
// const uri = UserAgent.makeURI("sip:alice@example.com");

// Create new Session instance in "initial" state
const session = new Inviter(userAgent, uri);

// Setup session state change handler
session.stateChange.on((newState: SessionState) => {
  switch (newState) {
    case SessionState.Establishing:
      console.log("Ringing");
      break;
    case SessionState.Established:
      console.log("Answered");
      break;
    case SessionState.Terminated:
      console.log("Ended");
      break;
  }
});

const constraints: MediaStreamConstraints = {
  audio: true,
  video: false
};

const sdhOptions: SessionDescriptionHandlerOptions = { constraints };

// Options including delegate to capture response messages
const inviteOptions: InviterInviteOptions = {
  requestDelegate: {
    onAccept: (response) => {
      console.log("Positive response = " + response);
    },
    onReject: (response) => {
      console.log("Negative response = " + response);
    }
  },
  // sessionDescriptionHandlerOptions: {
  //   constraints: {
  //     audio: true,
  //     video: false
  //   }
  // }
  sessionDescriptionHandlerOptions: sdhOptions
};

// Send initial INVITE
session.invite(inviteOptions)
  .then((request: OutgoingInviteRequest) => {
    console.log("Successfully sent INVITE");
    console.log("INVITE request = " + request);
  })
  .catch((error: Error) => {
    console.log("Failed to send INVITE");
  });
