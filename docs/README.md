# Documentation

Welcome!

TLDR: Start with running the [demo](../demo/README.md) or looking at [this](./simple-user.md) class.

## Orientation

What's here?

Herein lies Session Initiation Protocol (SIP) protocol software enabling internet endpoints (called user agents) to carry various forms of real-time multimedia session data such as voice, video, or text messages. Said software is divided into three (3) pieces - each of which provides a different integration point for development...

* SimpleUser class
  * [Demo](../demo/README.md)
  * [Overview](./simple-user.md)
  * [Reference](./simple-user/sip.js.md)
* API framework
  * [Overview](./api.md)
  * [Reference](./api/sip.js.md)
* Core library
  * [Overview](./core.md)
  * [Reference](./core/sip.js.md)

### SimpleUser class

The [SimpleUser](./simple-user.md) class provides a representation of a simple internet endpoint (a simple user agent). It requires an understanding of what a phone call is (but minimal knowledge of SIP) and fluency in JavaScript (for example, how to use a `Promise`). There are working [Demonstrations](../demo/README.md) provided to help get started. It is the recommended interface for many applications. It has its limitations. The [SimpleUser](./simple-user.md) class is implemented on top of the [API](./api.md) framework.

### API framework

The [API](./api.md) framework is intended to provide a complete and suitable framework on which to build most end user applications - business phones, video conferencing endpoints, smart doorbells. A working knowledge of the SIP protocol is a prerequisite for using it. (The SIP protocol is an internet standard the details of which are well beyond the scope of the documentation here. However, there are many resources available on the internet.) The framework provides infrastructure to connect with a SIP server as well as setup and maintain SIP registrations, sessions and subscription. Tthere are no user interface components in it. The source code of the [SimpleUser](./simple-user.md) class is well documented and provides a good example of how to get started using the [API](./api.md) framework. The framework is implemented on top of the [Core](./core.md) library.

### Core library

The [Core](./core.md) library provides lower level representations of the elements which comprise the SIP protocol. It implements the constructs required by user agents. It strives to be RFC complient. It is intended to provide the foundational building blocks upon which to build a higher level abstraction.

## Other Stuff
  * [Building](./BUILDING.md) the source code
  * [Compatibility](./compatibility.md) with JavaScript
  * [Migration](./MIGRATION.md) from older versions
