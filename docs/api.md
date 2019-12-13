# API Framework

## Overview

This API is intended to provide a complete and suitable framework for most end user applications wishing initiate and carry various forms of real-time multimedia session data such as voice, video, or text messages. 

The API is implemented on top of the [Core Library](./core.md) which provides lower protocol level access.

A working knowledge of the SIP protocol is a prerequisite for working with this API. The SIP protocol is an internet standard the details of which are well beyond the scope of the documentation herein. However there are many resources available. See: https://tools.ietf.org/html/rfc3261 for the primary specification.


## Reference Documentation

* [API Reference](./api/sip.js.md)

## Getting Started

```ts
import {
  Invitation,
  Inviter,
  InviterOptions,
  Referral,
  Registerer,
  RegistererOptions,
  Session,
  SessionState,
  UserAgent,
  UserAgentOptions
} from "sip.js/lib/api";

/*
 * Create a user agent
 */
const uri = UserAgent.makeURI("sip:alice@example.com");
if (!uri) {
  throw new Error("Failed to create URI");
}
const userAgentOptions: UserAgentOptions = {
  uri,
  /* ... */
};
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
    incomingSession.stateChange.addListener((newState: SessionState) => {
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
 * Start the user agent
 */
userAgent.start().then(() => {

  /*
   * Register the user agent
   */
  const registererOptions: RegistererOptions = { /* ... */ };
  const registerer = new Registerer(userAgent, registererOptions);
  registerer.register();

  /*
   * Send an outgoing INVITE request
   */
  const target = UserAgent.makeURI("sip:bob@example.com");
  if (!target) {
    throw new Error("Failed to create target URI.");
  }

  // Create a new Inviter
  const inviterOptions: InviterOptions = { /* ... */ };
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
  outgoingSession.stateChange.addListener((newState: SessionState) => {
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
```
