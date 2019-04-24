# Core Overview

Herein is an implementation of the core SIP protocol constructs.

## Getting Started

Start by taking a look at `UserAgentCore` & `UserAgentCoreDelegate` which provide the highest level interfaces for sending and receiving SIP request messages and the main integration (creating a new `UserAgentCore` is step one). Next take a look at `Session` & `SessionDelegate` which are products of a successful INVITE request and provide the interfaces for sending and receiving in dialog requests (BYE, for example) as well as for dealing with the offer/answer exchange.

## Interfaces and Implementations

### `./dialogs`
- `Dialog` implementation (https://tools.ietf.org/html/rfc3261#section-12)
- `InviteDialog` extension (https://tools.ietf.org/html/rfc3261#section-13)
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
The `Subscription` interfaces represents a SIP Subscription and is the result of a successful SUBSCRIBE request.
- `Subscription` interface (https://tools.ietf.org/html/rfc6665)
- `SubscriptionDelegate` interface (https://tools.ietf.org/html/rfc6665)

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

