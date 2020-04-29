# Release Road Map

## 0.15.0
- new API introduction with transition guide
- deprecation warning message in console log if using legacy UA
- new generated documentation base
- review license for correctness

## 0.15.x
- give entire src/api code a top down once over
- address transport connect/disconnect auto register issues
- address user agent tearing down cleanly issues
- address the outstanding issues with new API
- address SDH race condition issues
- port Simple to SimpleUser
- create demo for new API
- more documentation
- more tests

## 0.16.0
- new README.md
- remove old api
- remove old tests
- update documentation
- separate tsconfigs for src/*
- tighten up tslint and lint api, core, demo and tests
- review packaging best practices (es7, es6, drop es5)
- free core and API from DOM and Node dependencies
- cleanup and update sipjs.com

## 0.16.x
- more documentation
- more tests
- bug fixes
- 1.0 prep

# Work in Progress

## Documentation
README.md
- build
- demo
- docs
- etc
- src
- test

## Tests
- *Unit* tests are being written for low level "core" components (Transaction, Transport)
- *Integration* tests are being written high level "api" components (Session, Subscription)
  - Need to write more integration tests; Publisher, UserAgent, SimpleUser, etc

## Source

### API - Miscellaneous
- UserAgent: Should support multiple servers (or multiple Transports). Issue #706.
- Registerer: There is no good way to know if there is a request in progress (currently throws exception). Perhaps Registering/Unregistering state?
- Review Allowed Methods and Allow header so configurable/variable in more reasonable fashion
- Make sure all options buckets are deep copied

### Core - Miscellaneous
- Dialog UACs are creating messages while non-dialog UACs are being handed message in most cases,
  but not all cases; MessageUserAgentClient is used for both out of dialog and in dialog. 
  It would be worth it to have the constructor interface be consistent.
  Regardless, this needs to wait till post 0.16 as it doesn't make sense to port the old code.
- I believe all in and out of dialog requests should be able to be authenticated (confirm this).
  Currently only INVITE and re-INVITE work. There needs to be a small refactor to make it work for everything.
  Regardless, this needs to wait till post 0.16 as it doesn't make sense to port the old code.
- Messages (IncomingMessage, OutgoingRequestMessage) could use a make over (tied to Grammar work)
- Extra headers array approach is error prone

### Grammar - Refresh
- grammar.ts has everything typed as any
- parsed URIs are not able to always be matched to configured URI because of typing issues
- URI constructor doesn't allow user of type undefined, but grammar passed undefined is no user parsed
- URI should be strongly typed (currently using any for constructor params)
- URI allows "" for user and 0 for port which is confusing and should probably be undefined instead
- URI toString() can and does throw. Issue #286.
- IncomingMessage class has public properties that may not be set (!), internally generated 408 for example
- Handling incoming REGISTER, "Contact: *" header fails to parse - there's a test written for it

### SessionDescriptionHandler - Refresh
- Web (and React) versions need to be overhauled (events removed, peer connection observer added, etc, etc)
- SDH options & SDH modifiers options are applied somewhat ambiguously
  - This behavior was ported from legacy code and the issue punted down the road.
- Trickle ICE Support: https://tools.ietf.org/id/draft-ietf-mmusic-trickle-ice-sip-11.html
- Hold SDP offer too large for UDP

### URI - Refresh
- Cleanup URI class, should not default to "sip" scheme, get rid of useless type checking

## REFER handling - it has evolved over time and we are out of date

### The Session Initiation Protocol (SIP) Refer Method (2003)
https://tools.ietf.org/html/rfc3515
Abstract

   This document defines the REFER method.  This Session Initiation
   Protocol (SIP) extension requests that the recipient REFER to a
   resource provided in the request.  It provides a mechanism allowing
   the party sending the REFER to be notified of the outcome of the
   referenced request.  This can be used to enable many applications,
   including call transfer.

### Multiple Dialog Usages in the Session Initiation Protocol (2007)
https://tools.ietf.org/html/rfc5057
Abstract

   Several methods in the Session Initiation Protocol (SIP) can create
   an association between endpoints known as a dialog.  Some of these
   methods can also create a different, but related, association within
   an existing dialog.  These multiple associations, or dialog usages,
   require carefully coordinated processing as they have independent
   life-cycles, but share common dialog state.  Processing multiple
   dialog usages correctly is not completely understood.  What is
   understood is difficult to implement.

   This memo argues that multiple dialog usages should be avoided.  It
   discusses alternatives to their use and clarifies essential behavior
   for elements that cannot currently avoid them.

### Session Initiation Protocol (SIP) Call Control - Transfer (2009)
https://tools.ietf.org/html/rfc5589
Abstract

   This document describes providing Call Transfer capabilities in the
   Session Initiation Protocol (SIP).  SIP extensions such as REFER and
   Replaces are used to provide a number of transfer services including
   blind transfer, consultative transfer, and attended transfer.  This
   work is part of the SIP multiparty call control framework.

### SIP-Specific Event Notification (2012)
https://tools.ietf.org/html/rfc6665
Abstract

   This document describes an extension to the Session Initiation
   Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
   to provide an extensible framework by which SIP nodes can request
   notification from remote nodes indicating that certain events have
   occurred.

### Explicit Subscriptions for the REFER Method (2015)
https://tools.ietf.org/html/rfc7614
Abstract

   The Session Initiation Protocol (SIP) REFER request, as defined by
   RFC 3515, triggers an implicit SIP-Specific Event Notification
   framework subscription.  Conflating the start of the subscription
   with handling the REFER request makes negotiating SUBSCRIBE
   extensions impossible and complicates avoiding SIP dialog sharing.
   This document defines extensions to REFER that remove the implicit
   subscription and, if desired, replace it with an explicit one.

### Clarifications for the Use of REFER with RFC 6665 (2015)
https://tools.ietf.org/html/rfc7647
Abstract

   The SIP REFER method relies on the SIP-Specific Event Notification
   framework.  That framework was revised by RFC 6665.  This document
   highlights the implications of the requirement changes in RFC 6665,
   and updates the definition of the REFER method described in RFC 3515
   to clarify and disambiguate the impact of those changes.

### Clarifications for When to Use the name-addr Production in SIP Messages (2017)
https://tools.ietf.org/html/rfc8217
Abstract

   RFC 3261 constrained several SIP header fields whose grammar contains
   the "name-addr / addr-spec" alternative to use name-addr when certain
   characters appear.  Unfortunately, it expressed the constraints with
   prose copied into each header field definition, and at least one
   header field was missed.  Further, the constraint has not been copied
   into documents defining extension headers whose grammar contains the
   alternative.

