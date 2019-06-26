# Documentation

* [API Overview](#api-overview)
* [API Reference](./api/sip.js.md)
* [Core Library Overview](#core-library-overview)
* [Core Library Reference](./core/sip.js.md)

# API Overview

Reference Documentation: [API](./api/sip.js.md)

The SIP application programming interface (API) herein is implemented on top of the
[Core Library](#core-library).

The API is intended to provide a complete and suitable interface for most end user applications.

However, if an application requires protocol level access it may need to utilize the core library directly.

## Example

```ts
class MyApp implements UserAgentDelegate {
  private userAgent: UserAgent;

  constructor() {
    // Set configuration options for a user agent
    const options: UserAgentOptions = {/* ... */};
    // Create a new user agent
    this.userAgent = new UserAgent(options);
    // Set ourselves as the user agent delegate
    this.userAgent.delegate = this;
  }

  // Send outgoing INVITE request
  public invite(target: URI): void {
    // Create a new inviter
    const inviter = new Inviter(this.userAgent, target);
    // Create our session handler for the inviter
    const handler = new MySessionHandler(inviter);
    // Send the INVITE request
    inviter.invite()
      .then(() => {
        // INVITE successfully sent
      })
      .catch((error: Error) => {
        // INVITE failed to send
      });
  }

  // Handle incoming INVITE request
  public onInvite?(invitation: Invitation): void {
    // Create our session handler for the invitation
    const handler = new MySessionHandler(invitation);
    // Send a 200 OK response
    invitation.accept()
      .then(() => {
        // 200 OK successfully sent
      })
      .catch((error: Error) => {
        // 200 OK failed to send
      });
  }
}

class MySessionHandler implements SessionDelegate {
  constructor(private session: Session) {
    // Set ourselves as the session delegate
    this.session.delegate = this;

    // Handle session state changes.
    this.session.stateChange.on((newState: SessionState) => {
      switch (newState) {
        case "establishing":
          // Session is establishing.
          break;
        case "established":
          // Session has been established.
          break;
        case "terminated":
          // Session has terminated.
          break;
        default:
          break;
      }
    });
  }

  // Handle incoming REFER request.
  public onRefer?(referral: Referral): void {
    // ...
  }
}
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

