# BroadSoft Access-Side Extensions

This module provides support for common BroadSoft Access-Side SIP extensions in SIP.js:

1. **Call-Info with answer-after parameter** - Auto-Answer
2. **NOTIFY (Event: talk)** - Remote Control for answering/resuming calls
3. **NOTIFY (Event: hold)** - Remote Control for placing calls on hold

## Features

### 1. Auto-Answer (Call-Info Header)

Automatically answer incoming calls when the `answer-after` parameter is present in the Call-Info header.

**SIP Header Example:**
```
Call-Info: <sip:example.com>; answer-after=1
```

**Usage:**
```typescript
import { BroadSoft, Invitation } from "sip.js";

const autoAnswerOptions: BroadSoft.AutoAnswerOptions = {
  enabled: true,
  onBeforeAutoAnswer: (delaySeconds) => {
    console.log(`Auto-answering in ${delaySeconds}s`);
  },
  onAfterAutoAnswer: () => {
    console.log("Auto-answered");
  }
};

// In your onInvite handler:
userAgent.delegate = {
  onInvite: (invitation: Invitation) => {
    if (BroadSoft.shouldAutoAnswer(invitation)) {
      // Returns a handle ({ cancel() }) or false if nothing was scheduled.
      // The schedule also cancels itself automatically if the invitation is
      // answered manually, canceled or terminated before the timer fires.
      const autoAnswer = BroadSoft.handleAutoAnswer(invitation, autoAnswerOptions);
    }
  }
};
```

**Value handling:**
- `answer-after` must be a non-negative integer (seconds); malformed values
  (`1abc`, `-5`, `1.9`, empty) are ignored and no auto-answer is scheduled.
- Extremely large values are capped at the maximum timer delay (2^31 − 1 ms)
  rather than overflowing and answering immediately.
- If the parameter appears multiple times in one header, the last conforming
  value wins; across multiple Call-Info headers, the first header carrying the
  parameter wins.

### 2. Remote Control - Talk Events (NOTIFY with Event: talk)

Per the BroadSoft specification, `Event: talk` instructs the phone to answer a
ringing call or resume a held call:

- Session in `Initial` state (ringing) → `invitation.accept()` (200 OK with SDP)
- Session in `Established` state → re-INVITE with `a=sendrecv` (resume from hold)
- Other states → no action

**SIP Message Example (FreeSWITCH `uuid_phone_event` sends an empty body):**
```
NOTIFY sip:alice@example.com SIP/2.0
Event: talk
Content-Length: 0
```

A body of `talk` is equivalent to an empty body. A body of `mute` is parsed and
surfaced to the application via `onTalkEvent(TalkAction.Mute)` but performs **no**
SIP signaling and **no** media operation — muting is left to the application.

### 3. Remote Control - Hold Events (NOTIFY with Event: hold)

`Event: hold` instructs the phone to place an established call on hold:

- Session in `Established` state → re-INVITE with `a=sendonly` (hold)
- All other states (ringing, dialing, terminated) → no action

**SIP Message Example:**
```
NOTIFY sip:alice@example.com SIP/2.0
Event: hold
Content-Length: 0
```

An empty body and a body of `hold` are equivalent.

### Remote control usage

```typescript
import { BroadSoft } from "sip.js";

const remoteControlOptions: BroadSoft.RemoteControlOptions = {
  enabled: true,
  onTalkEvent: (action) => {
    console.log(`Talk event: ${action}`); // update UI, manage local mute, etc.
  },
  onHoldEvent: (action) => {
    console.log(`Hold event: ${action}`);
  }
};

// In your session delegate:
invitation.delegate = {
  onNotify: (notification) => {
    if (BroadSoft.isBroadSoftNotification(notification)) {
      BroadSoft.handleRemoteControlNotification(invitation, notification, remoteControlOptions).catch((error) => {
        console.error("Error handling remote control NOTIFY:", error);
      });
    }
    // The application owns the NOTIFY response.
    notification.accept();
  }
};
```

## API Reference

### Types

#### `AutoAnswerOptions`
```typescript
interface AutoAnswerOptions {
  enabled: boolean;
  onBeforeAutoAnswer?: (answerAfter: number) => void;
  onAfterAutoAnswer?: () => void;
  delayOverride?: number; // Override header delay (seconds)
  logger?: Logger; // Optional: log otherwise-silent failures
}
```

#### `RemoteControlOptions`
```typescript
interface RemoteControlOptions {
  enabled: boolean;
  onTalkEvent?: (action: TalkAction) => void;
  onHoldEvent?: (action: HoldAction) => void;
  logger?: Logger; // Optional: log otherwise-silent failures
}
```

#### `TalkAction`
```typescript
enum TalkAction {
  Talk = "talk", // Answer / resume (triggers SIP signaling)
  Mute = "mute"  // Callback-only; no SIP or media operation
}
```

#### `HoldAction`
```typescript
enum HoldAction {
  Hold = "hold" // Place the call on hold (triggers SIP signaling)
}
```

### Functions

#### Auto-Answer Functions

- `shouldAutoAnswer(invitation: Invitation): boolean`
  - Check if invitation has auto-answer enabled

- `getAutoAnswerDelay(request: IncomingRequestMessage): number | undefined`
  - Get the answer-after delay in seconds

- `handleAutoAnswer(invitation: Invitation, options: AutoAnswerOptions, acceptOptions?: InvitationAcceptOptions): AutoAnswerHandle | false`
  - Schedule auto-answering an invitation; returns a cancellation handle or false

- `extractCallInfoHeaders(request: IncomingRequestMessage): CallInfoHeader[]`
  - Parse all Call-Info headers from a request

#### Remote Control Functions

**High-level API (recommended - works with SessionDelegate.onNotify):**

- `isBroadSoftNotification(notification: Notification): boolean`
  - Check if a Notification is a BroadSoft remote control event

- `handleRemoteControlNotification(session: Session, notification: Notification, options: RemoteControlOptions): Promise<boolean>`
  - Parse the NOTIFY, invoke callbacks, and apply the SIP signaling action
    (accept / resume / hold). Does **not** send the NOTIFY response — call
    `notification.accept()` yourself.

- `parseEventHeaderFromNotification(notification: Notification): BroadSoftEvent | undefined`
- `parseNotifyBodyFromNotification(notification: Notification, eventType: BroadSoftEvent): BroadSoftNotifyBody | undefined`

**Low-level API (IncomingNotifyRequest variants, same semantics):**

- `isBroadSoftNotify(request: IncomingNotifyRequest): boolean`
- `handleRemoteControlNotify(session: Session, request: IncomingNotifyRequest, options: RemoteControlOptions): Promise<boolean>`
- `parseEventHeader(request: IncomingNotifyRequest): BroadSoftEvent | undefined`
- `parseNotifyBody(request: IncomingNotifyRequest, eventType: BroadSoftEvent): BroadSoftNotifyBody | undefined`

**Manual control functions:**

- `applyTalkAction(session: Session, action: TalkAction): Promise<void>`
  - Manually apply a talk action (accept a ringing Invitation / resume re-INVITE)
- `applyHoldAction(session: Session): Promise<void>`
  - Manually apply a hold action (hold re-INVITE; no-op unless Established)
- `holdModifier` / `resumeModifier`
  - SDP direction modifiers used by the actions above. Note: `resumeModifier`
    rewrites *every* `sendonly`/`inactive` attribute; a media section that was
    originally one-way for reasons unrelated to hold is also rewritten. If your
    application needs to preserve such directions, manage hold via the session
    description handler's `hold` option instead (see `SimpleUser.hold()`).

## Complete Example

See [examples/broadsoft-extensions.ts](../../../examples/broadsoft-extensions.ts) for a complete working example.

## Protocol Details

### Call-Info Header Format

```
Call-Info: <URI>; answer-after=<seconds>[; other-params]
```

- `answer-after=0` - Answer immediately
- `answer-after=N` - Answer after N seconds delay

### NOTIFY response ownership

The library never answers a BroadSoft NOTIFY on your behalf when a
`SessionDelegate.onNotify` is installed: the delegate owns the response and must
call `notification.accept()` (or `reject()`). Without a delegate, `Session`
auto-accepts NOTIFYs with a 200 OK.

### Early-dialog NOTIFY

BroadSoft servers (and FreeSWITCH's `uuid_phone_event`) deliver `Event: talk`
NOTIFYs on the early dialog while the call is still ringing. SIP.js accepts
`Event: talk`/`Event: hold` NOTIFYs during the `Initial` and `Establishing`
session states for this reason; all other NOTIFY event packages retain the
Established-only rule.

## Browser Compatibility

The remote control features require WebRTC support and work with the Web platform `SessionDescriptionHandler`. They have been tested with:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Notes

- Auto-answer only accepts an invitation still in the `Initial` state; the
  scheduled answer cancels itself if the invitation is answered manually,
  canceled or terminated first.
- Remote control actions (accept / resume / hold) are applied automatically by
  `handleRemoteControlNotification` / `handleRemoteControlNotify`; the
  callbacks are for application/UI updates.
- Callback errors are caught; provide `logger` in the options to surface them.

## References

- BroadSoft/Cisco BroadWorks Interface Specifications
- RFC 3261 - SIP: Session Initiation Protocol
- RFC 3264 - An Offer/Answer Model with SDP
- RFC 3515 - The Session Initiation Protocol (SIP) Refer Method
