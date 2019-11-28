# SimpleUser

## Overview

The `SimpleUser` class provides an easy simplified interface for making audio and video calls in a web page.

While not intended for all use cases, `SimpleUser` is perhaps suitable for many single page web browser applications. For instance, the examples on the [Demo](../demo/README.md) page are implemented using the `SimpleUser` class exclusively.

The [Demo](../demo/README.md) source code is well documented and provides concrete examples of how to use all the features provided by `SimpleUser`. Furthermore, there is complete reference documentation (link below).

If requirements are more advanced, working directly with the [API](./api.md) provides more flexiblity.

## Reference Documentation

* [SimpleUser Class Reference](./simple-user/sip.js.md)

## Getting Started

```ts
import { SimpleUser, SimpleUserOptions } from "sip.js/lib/platform/web";

// Helper function to get an HTML audio element.
function getAudioElement(id: string): HTMLAudioElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  }
  return el;
}

// Main function.
async function main(): Promise<void> {

  // SIP over WebSocket Server URL
  // This is the URL of a SIP over WebSocket server
  // which will complete the call. FreeSwitch is an
  // example of a server which supports SIP over WebSocket.
  // SIP over WebSocket is an internet standard the
  // details of which are outside the scope of this
  // documentation, but there are many resources available.
  // See: https://tools.ietf.org/html/rfc7118 for the specification.
  const server = "wss://sip.example.com";

  // SIP Request URI
  // This is the SIP Request URI of the destination.
  // It's "Who you wanna call?" SIP is an internet
  // standard the details of which are outside the scope of
  // this documentation, but there are many resources available.
  // See: https://tools.ietf.org/html/rfc3261 for the specification.
  const destination = "sip:welcome@example.com";

  // Configuration Options
  // These are configuration options for the `SimpleUser` instance.
  // Here we are setting the HTML audio element we want to use to
  // play the audio received from the remote end of the call.
  // An audio element is needed to play the audio received from the
  // remote end of the call. Once the call is established, a `MediaStream`
  // is attached to the provided audio element's `src` attribute.
  const options: SimpleUserOptions = {
    media: {
      remote: {
        audio: getAudioElement("remoteAudio")
      }
    }
  };

  // Construct a SimpleUser instance.
  const simpleUser = new SimpleUser(server, options);

  // Connect to server.
  await simpleUser.connect();

  // Place call to the destination.
  await simpleUser.call(destination);
}

main()
  .then(() => console.log(`Success`))
  .catch((error: Error) => console.error(`Failure`, error));
}
```
