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

## 1. `UA` class replaced by `UserAgent` class 

### Configuration

The following options are no longer supported. They have been removed or deprecated and may no longer work...
* `allowLegacyNotifications`
* `allowOutOfDialogRefers`
* `authenticationFactory`
* `autostart`
* `dtmfType`
* `hackIpInContact`
* `hackViaTcp`
* `hackWssInTransport`
* `registerOptions`
* `register`

### Construction

Previously...
```
const ua = new UA(options);
```

Now...
```
const userAgent = new UserAgent(options);
```

## 2. `UA.register()` replaced by `Registerer` class

Previously...
```
const options = {
  uri: "alice@example.com";
  authenticationUsername: "username",
  authenticationPassword: "password",
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
```

Now...
```
const userAgent = new UserAgent();

const aor = new URI("sip", "alice", "example.com");

const options = {
  authenticationUsername: "username",
  authenticationPassword: "password",
}

const registerer = new Registerer(userAgent, aor, options);

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
```

## 3. `UA.on("invite")` replaced by `UserAgent.delegate`


Previously...
```
const ua = new UA();

ua.on("invite", (session) => {
  console.log("Invite received");
  session.accept();
});
```

Now...
```
const options = {
  delegate: {
    onInvite: (invitation) => {
      console.log("Invite received");
      invitation.accept();
    }
  }
}

const userAgent = new UserAgent(options);
```

## 4. `UA.invite()` replaced by `Inviter` class

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
// Create new Session instance in "initial" state
const session = new Inviter(userAgent);

// Setup session state change handler
session.stateChange.on((newState) => {
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

// Target URI
const uri = new URI("sip", "alice", "example.com");

// Options including delegate to capture response messages
const options =  {
  delegate: {
    onAccepted: (response) => {
      console.log("Positive response = " + response);
    },
    onRejected: (response) => {
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
session.invite(uri, options)
  .then((request) => {
    console.log("Successfully sent INVITE");
    console.log("INVITE request = " + request);
  })
  .catch((error) => {
    console.log("Failed to send INVITE");
  });
```
