# Migration from 0.14.x to 0.15.x

The 0.15.x release is a backwards compatible drop-in replacement for 0.14.x.

The 0.15.x release introduces a "new" API and deprecates the "legacy" API in 0.14.x.

The 0.15.x release is intended to facilitate migration from the legacy API to the new API.

The 0.15.x release contains both the new API and the legacy API, but the two are not compatible. That is, you may use one or the other but cannot "mix" the usage of the two. For example, a `Session` created with the legacy API is not compatible with a `Session` in the new API.

The legacy API will be removed in 0.16.x in favor of the new API.

# Migration from 0.15.x to 0.16.x

The 0.16.x release is not backwards compatible with 0.15.x.

Significant architectural changes were made to address long standing issues including some ambiguities and race conditions that were difficult to resolve in the prior architecture. Additionally, years of code contributions to different aspects of the code base had resulted in inconsistencies in the overall API interface. Improvements made to some aspects of the API where often not carried across the whole API. An attempt has been made to rectify these inconsistencies in the new API by taking the "best" approach and applying it across the board.

Architectural changes include:

1. Classes are constructed then methods on those classes are called to send requests.
2. Methods which send requests/responses now return a `Promise` (instead of `this`).
3. Events have been replaced with delegates and finite state machines.

Migrating to the new API entails updating code accordingly. 

## 1. `UserAgent` class replaces...

- `UA`

### Configuration Options

The following `UA.Options` have been modified for use as `UserAgentOptions`...
- `authenticationFactory`
  - removed (it was a noop)
- `authorizationUser`
  - renamed to `authorizationUsername`
- `autostart`
  - renamed to `autoStart` (case changed for consistency)
- `autostop`
  - renamed to `autoStop` (case changed for consistency)
- `dtmfType`
  - use `Session.info()` for "out-of-band" DTMF or `SessionDescriptionHandler` for "in-band" DTMF.
- `experimentalFeatures`
  - removed (it was a noop)
- `hostportParams`
  - removed (it was a noop)
- `log`
  - use `logBuiltinEnabled`, `logLevel` and `logConnector`
- `password`
  - renamed `authorizationPassword`
- `registerOptions`
  - pass `RegistererOptions` to `Registerer` instead (see below).
- `register`
  - use `Registerer.register()` instead (see below).
- `100rel`
  - renamed `sipExtension100rel`
- `replaces`
  - renamed `sipExtensionReplaces`
- `extraSupported`
  - renamed `sipExtensionExtraSupported`
- `uri`
  - must be a `URI` instance, use `UserAgent.makeURI()` to create (see below).

### Construction, Starting, and Stopping

Previously...
```
string uri = "sip:alice@example.com";
const options: UA.Options = {
  uri: uri
  /* set various other options */
};
const ua = new UA(options);
ua.start();
ua.stop();
```

Now...
```
const uri = UserAgent.makeURI("sip:alice@example.com");
if (!uri) {
  // Failed to create URI
}
const options: UserAgentOptions = {
  uri: uri,
  /* set various other options */
};
const userAgent = new UserAgent(options);
userAgent.start();
userAgent.stop();
```

## 3. `Registerer` class replaces...

- `UA.register()`
- `UA.unregister()`
- `UA.isregistered()`
- `UA.on("registered")`
- `UA.on("unregistered")`
- `UA.on("registrationFailed")`

Previously...
```
const uri = "sip:alice@example.com";
const options = {
  authenticationUsername: "username",
  authenticationPassword: "password",
  uri: uri
}

const ua = new UA(options);

ua.on("registered", (response: any) => {
  console.log("Registered");
});
ua.on("registrationFailed", () => {
  console.log("Failed to register");
});
ua.on("unregistered", (response, cause) => {
  console.log("Unregistered");
});

ua.register();

const registered = ua.isRegistered();

ua.unregister()
```

Now...
```
const uri = UserAgent.makeURI("sip:alice@example.com");
const options = {
  authorizationUsername: "username",
  authorizationPassword: "password",
  uri: uri
}

const userAgent = new UserAgent(options);

const registerer = new Registerer(userAgent);

// Setup registerer state change handler
registerer.stateChange.on((newState) => {
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
registerer.register()
  .then((request) => {
    console.log("Successfully sent REGISTER");
    console.log("REGISTER request = " + request);
  })
  .catch((error) => {
    console.log("Failed to send REGISTER");
  });

const registered = registerer.registered;

registerer.unregister()
```

## 4. `Inviter` class replaces...

- `UA.invite()`

Previously...

* Setup target and options
* Call `UA.invite()` to create `Session` and send INVITE
* Register event listener to `UA` capture sent INVITE request message
* Register event listeners on `Session` to capture response messages
* Register event listeners on `Session` to handle session state changes

```
// Target URI
const uri = new URI("sip", "alice", "example.com");

// Options
const options =  {
  sessionDescriptionHandlerOptions: {
    constraints: {
      audio: true,
      video: false
    }
  }
};

// Send initial INVITE and create a new Session instance
let session;
try {
  session = ua.invite(uri, options);
} catch (error) {
  console.log("Failed to create session");
  throw error;
}

// Add event listener to UA instance to capture sent INVITE
const inviteSentListener = (context) => {
  if (context === session) {
    console.log("Successfully sent INVITE");
    console.log("INVITE request = " + context.request);
    ua.off(inviteSentListener)
  }
};
ua.on("inviteSent", inviteSentListener);

// Add event listeners to Session instance to handle state changes and capture responses
session.on("progress", () => {
  console.log("Ringing");
});
session.on("accepted", (response) => {
  console.log("Answered");
  console.log("Positive response = " + response);
});
session.on("failed", () => {
  console.log("Perhaps failed to send INVITE?");
  console.log("Regardless something went wrong.");
});
session.on("rejected", (response) => {
  console.log("Negative response = " + response);
});
session.on("terminated", () => {
  console.log("Ended");
});
```

Now...
* Construct new `Inviter`
* Setup session state change handler
* Setup target and options (including delegate to capture response messages)
* Call `Inviter.invite()` to send INVITE which returns a `Promise` resolving the sent request

```
// Target URI
const uri = UserAgent.makeURI("sip:alice@example.com");

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
  sessionDescriptionHandlerOptions: {
    constraints: {
      audio: true,
      video: false
    }
  }
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
```

## 5. `Messager` class replaces...

- `UA.message()`

TODO

## 6. `Publisher` class replaces...

- `UA.publish()`

TODO

## 7. `Subscriber` class replaces...

- `UA.subscribe()`

TODO

## 8. Core replaces...

- `UA.request()`

TODO

## 9. `UserAgentDelegate` interface replaces

- `UA.on("invite")`
- `UA.on("message")`
- `UA.on("notify")`
- `UA.on("outOfDialogReferRequested")`

Previously...
```
const ua = new UA();

ua.on("invite", (session) => {
  console.log("INVITE received");
  session.accept();
});

ua.on("message", (message) => {
  console.log("MESSAGE received");
});

ua.on("notify", (notify) => {
  console.log("NOTIFY received");
});

ua.on("outOfDialogReferRequested", (refer) => {
  console.log("REFER received");
});
```

Now...
```
const options = {
  delegate: {
    onInvite: (invitation) => {
      console.log("INVITE received");
      invitation.accept();
    },
    onMessage: (message) => {
      console.log("MESSAGE received");
      message.accept();
    },
    onNotify: (notification) => {
      console.log("NOTIFY received");
      notification.accept();
    },
    onRefer: (referral) => {
      console.log("REFER received");
      referral.accept();
    }
  }
}

const userAgent = new UserAgent(options);
```
