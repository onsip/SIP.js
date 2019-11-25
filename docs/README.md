# Compatibility

## ES2015 (ES6)
The API and core libraries are compatible with ES2015 or later.

Note that TypeScript [does not auto-polyfill](https://github.com/microsoft/TypeScript/issues/3101),
so even though the compiled target output is currently ES5, the libraries require and utilize
ES2015 (ES6) features (as constrained by the `lib` compiler setting).

## ES5 Deprecated
The API and core libraries may be ES5 compatible if used with an ES6 shim.
No attempt is currently being made to support using the libraries with an ES6 shim.

The source TypeScript is currently transpiled to an ES5 target so it may
run in an ES5 environment if an ES6 shim is provided, however it is expected
that the target may be changed to ES6 in the relatively near future and thus
eliminating any support of ES5 environments (IE11 being the notable case).


# Documentation

* [API Overview](#api-overview)
* [API Reference](./api/sip.js.md)
* [Core Library Overview](#core-library-overview)
* [Core Library Reference](./core/sip.js.md)
* [SimpleUser Class Overview](#simpleuser-class-overview)
* [SimpleUser Class Reference](./simple-user/sip.js.md)

# API Overview

Reference Documentation: [API](./api/sip.js.md)

The SIP application programming interface (API) herein is implemented on top of the
[Core Library](#core-library).

The API is intended to provide a complete and suitable interface for most end user applications.

However, if an application requires protocol level access it may need to utilize the core library directly.

## Example (TypeScript)

```ts
/*
 * Create a user agent
 */
const uri = UserAgent.makeURI("sip:alice@example.com");
if (!uri) {
  // Failed to create URI
}
const userAgentOptions: UserAgentOptions = {
  uri: uri,
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
```

# Core Library Overview

Reference Documentation: [Core Library](./core/sip.js.md)

Herein is an implementation of the core SIP protocol constructs.

The library is intended to provide an implemenation the RFC specification details usable as building blocks for a "higher level" interface.

In fact, most applications should find the "higher level" [API](#api)
which is built on top of this core library to be the optimial integration point.

## Getting Started

Start by taking a look at `UserAgentCore` & `UserAgentCoreDelegate` which provide the highest level interfaces for sending and receiving SIP request messages and the main integration point (creating a new `UserAgentCore` is step one). Next take a look at `Session` & `SessionDelegate` which are products of a successful INVITE request and provide the interfaces for sending and receiving in dialog requests (BYE, for example) as well as for dealing with the offer/answer exchange.

## Interfaces and Implementations

### `./dialogs`
- `Dialog` implementation (https://tools.ietf.org/html/rfc3261#section-12)
- `SessionDialog` extension (https://tools.ietf.org/html/rfc3261#section-13)
- `SubscriptionDialog` extension (https://tools.ietf.org/html/rfc6665)

### `./messages`
- `IncomingRequest` interface (https://tools.ietf.org/html/rfc3261#section-7.1)
- `IncomingResponse` interface (https://tools.ietf.org/html/rfc3261#section-7.2)
- `OutgoingRequest` interface (https://tools.ietf.org/html/rfc3261#section-7.1)
- `OutgoingResponse` interface (https://tools.ietf.org/html/rfc3261#section-7.2)
- Method specific extensions 

### `./transactions`
- `Transaction` implementation (https://tools.ietf.org/html/rfc3261#section-17)
- `ClientTransaction` extension (https://tools.ietf.org/html/rfc3261#section-17.1)
- `InviteClientTransaction` extension (https://tools.ietf.org/html/rfc3261#section-17.1.1)
- `NonInviteClientTransaction` extension (https://tools.ietf.org/html/rfc3261#section-17.1.2)
- `ServerTransaction` extension (https://tools.ietf.org/html/rfc3261#section-17.2)
- `InviteServerTransaction` extension (https://tools.ietf.org/html/rfc3261#section-17.2.1)
- `NonInviteServerTransaction` extension (https://tools.ietf.org/html/rfc3261#section-17.2.2)

### `./session`
The `Session` interface represents a SIP Session and is the result of a successful INVITE request.
- `Session` interface (https://tools.ietf.org/html/rfc3261#section-13)
- `SessionDelegate` interface (https://tools.ietf.org/html/rfc3261#section-13)

### `./subscription`
The `Subscription` interface represents a SIP Subscription and is the result of a successful SUBSCRIBE request.
- `Subscription` interface (https://tools.ietf.org/html/rfc6665)
- `SubscriptionDelegate` interface (https://tools.ietf.org/html/rfc6665)

### `./timers`
- `Timers` constants (https://tools.ietf.org/html/rfc3261#page-265)

### `./transport`
- `Transport` interface (https://tools.ietf.org/html/rfc3261#section-18)

### `./user-agent-core`
The `UserAgentCore` class provides the primary external interface with the SIP core.

- `UserAgentCore` UAC & UAS core implementations (https://tools.ietf.org/html/rfc3261#section-5)
- `UserAgentCoreDelegate` UAC & UAS core implementations (https://tools.ietf.org/html/rfc3261#section-5)

### `./user-agents`
- `UserAgentClient` implementation (https://tools.ietf.org/html/rfc3261#section-8.1)
- `UserAgentServer` implementation (https://tools.ietf.org/html/rfc3261#section-8.2)
- Method specific extensions 

# SimpleUser Class Overview

Reference Documentation: [SimpleUser Class](./simple-user/sip.js.md)

The `SimpleUser` class is a simplified interface to make getting up and running easier for new users. While it is not intended for advanced use cases, it is perhaps suitable for many simple single page web browser applications. For examples, see the [Demo](../demo/README.md)  page.
