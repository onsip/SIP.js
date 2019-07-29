import {
  Inviter,
  InviterOptions,
  Referral,
  RegistererOptions,
  Session,
  SessionState,
  UserAgent,
  UserAgentOptions,
} from ".";
import { Invitation } from "./invitation";
import { Registerer } from "./registerer";

/*
 * Create a user agent
 */

const userAgentOptions: UserAgentOptions = {/* ... */ };
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

});
