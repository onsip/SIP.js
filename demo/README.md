# Demonstrations

## Building

Clone this repository, then...

```
npm install
npm run build-demo
```

## Running

The demos will run in Chrome, Firefox, or other web browsers which supports WebRTC.

In your web browser, open the `index.html` file in this directory to run the demos.

### Safari

Safari requires either...
- enabling `Develop -> WebRTC -> Allow Media Capture on Insecure Sites`
- or serving the demo from a secure website

## Development

These demonstrations are built on the `SimpleUser` class which provides some basic
functionality via a simple interface. While `SimpleUser` may be all that is needed
for some use cases (such as these demos), it is not intended to provide a suitable
interface for most (much less all) applications. However the `SimpleUser` class is
arguably a good example of how the SIP.js API can be utilized generally.

See the [Documentation](../docs/README.md) page for more info on `SimpleUser`.
