# SessionDescriptionHandler - WebRTC

## Overview

The `SessionDescriptionHandler` class provides an implementation of which adhears to the `SessionDescriptionHandler` interface required by the [API](./api.md). The class is intended to be suitable for extending to provide custom behaviour if needed.

## Reference Documentation

* [SessionDescriptionHandler Class Reference](./session-description-handler/sip.js.md)

## How do I get the session description handler for an `Invitation` or an `Inviter`?

`Session` has a `sessionDescriptionHandler` property. `Invitation` and `Inviter` extend `Session`, so...

See [`Session.sessionDescriptionHandler` docs](./api/sip.js.session.sessiondescriptionhandler.md) for more info.

## When is a `Session`'s session description handler available?

If `Session` is an instance of `Inviter` and an offer was sent in the INVITE, `Session.sessionDescriptionHandler` will be defined when the session state changes to `SessionState.Establishing`. Otherwise it will be defined when the session state changes to `SessionState.Established`.

## How do I play the local and remote `MediaStream`?

The session description handler and media tracks are availble once the `Session` state transitions to `SessionState.Established`...

```ts
import { Session, SessionState, Web } from "sip.js";

function handleStateChanges(
  session: Session,
  localHTMLMediaElement: HTMLVideoElement | undefined,
  remoteHTMLMediaElement: HTMLAudioElement | HTMLVideoElement | undefined,
): void {
  // Track session state changes and set media tracks to HTML elements when they become available.
  session.stateChange.addListener((state: SessionState) => {
    switch (state) {
      case SessionState.Initial:
        break;
      case SessionState.Establishing:
        break;
      case SessionState.Established:
        const sessionDescriptionHandler = session.sessionDescriptionHandler;
        if (
          !sessionDescriptionHandler ||
          !(sessionDescriptionHandler instanceof Web.SessionDescriptionHandler)
        ) {
          throw new Error("Invalid session description handler.");
        }
        if (localHTMLMediaElement) {
          localHTMLMediaElement.srcObject = sessionDescriptionHandler.localMediaStream;
          localHTMLMediaElement.play().catch((error: Error) => {
            console.error("Error playing local media");
            console.error(error);
          });
        }
        if (remoteHTMLMediaElement) {
          remoteHTMLMediaElement.srcObject = sessionDescriptionHandler.remoteMediaStream;
          remoteHTMLMediaElement.play().catch((error: Error) => {
            console.error("Error playing remote media");
            console.error(error);
          });
        }
        break;
      case SessionState.Terminating:
        break;
      case SessionState.Terminated:
        break;
      default:
        throw new Error("Unknown session state.");
    }
  });
}
```

## How do I override how local media is obtained?

Providing for alternative media acquisition can be done by providing a `MediaStreamFactory`...

```ts
import { UserAgent, UserAgentOptions, Web } from "sip.js";

// Create media stream factory
const myMediaStreamFactory: Web.MediaStreamFactory = (
  constraints: MediaStreamConstraints,
  sessionDescriptionHandler: Web.SessionDescriptionHandler
): Promise<MediaStream> => {
  const mediaStream = new MediaStream(); // my custom media stream acquisition
  return Promise.resolve(mediaStream);
}

// Create session description handler factory
const mySessionDescriptionHandlerFactory: Web.SessionDescriptionHandlerFactory = 
  Web.defaultSessionDescriptionHandlerFactory(myMediaStreamFactory);

// Create user agent
const myUserAgent = new UserAgent({
  sessionDescriptionHandlerFactory: mySessionDescriptionHandlerFactory
});
```

## How do I detect if a track was added or removed?

The session description handler and media tracks are availble once the `Session` state transitions to `SessionState.Established`, however there are cases where tracks may be added or removed if the media changes - for example, on upgrade from audio only to a video session. Not also that when the `SessionDescriptionHandler` is constructed the media stream initially has no tracks, so the presence of tracks should not be assumed. 

See [`SessionDescriptionHandler.remoteMediaStream` docs](./session-description-handler/sip.js.sessiondescriptionhandler.remotemediastream.md) for more info.

```ts
import { Web } from "sip.js";

function handleAddTrack(
  sessionDescriptionHandler: Web.SessionDescriptionHandler
): void {
  sessionDescriptionHandler.remoteMediaStream.onaddtrack = (event) => {
    const track = event.track;
    console.log("A track was added");
  };
  sessionDescriptionHandler.remoteMediaStream.onremovetrack = (event) => {
    const track = event.track;
    console.log("A track was removed");
  };
}
```

## How do I get a handle on the session description handler when it is created?

If you must have access as soon as it is created and before it is utilized, use the session delegate.

See [`SessionDelegate.onSessionDescriptionHandler()` docs](./api/sip.js.sessiondelegate.onsessiondescriptionhandler.md) for more info.

```ts
import { SessionDescriptionHandler } from "sip.js";

function handleSessionDescriptionHandlerCreated(session: Session): void {
  session.delegate = {
    onSessionDescriptionHandler: (
      sessionDescriptionHandler: SessionDescriptionHandler,
      provisional: boolean
    ) => {
      console.log("A session description handler was created");
    },
  };
}
```

## How do I get a handle on the peer connection?

`SessionDescriptionHandler` has a `peerConnection` property.

See [`docs](./session-description-handler/sip.js.sessiondescriptionhandler.md) for more info.


## How do I get a handle on the peer connection events?

`SessionDescriptionHandler` has a `peerConnectionDelegate` property.

See [`docs](./session-description-handler/sip.js.sessiondescriptionhandler.md) for more info.
