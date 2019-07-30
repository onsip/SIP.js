
# Release Road Map

# 15.0
- new api introduction with transition guide
- deprecation warning message in console log if using UA
- new generated documentation base
- review license for correctness

# 15.1
- port simple to new api
- more documentation
- more tests

# 15.2
- address the outstanding issues with new api
- address sdh race condition issues
- address transport connect/disconnect auto register issues
- address make user agent tear down cleanly
- more documentation
- more tests

# 16.0
- new demo
- new readme
- remove old api
- remove old tests
- separate tsconfigs for src/*
- review packaging (es6/best practices)
- free of DOM and Node dependency
- more documentation
- more tests

# Work in Progress

## Open Items
- Dependencies on "old" api files need to be removed from src/api
- The entire src/api code needs a top down once over
- Music-on-hold support needed
- Hold sdp offer too large for UDP
- Options buckets deep copy
- Dialog UACs are creating messages while non-dialog UACs are being handed message.
- Extra headers approach is error prone
- Incoming request, accept races cancel.
-- That is, attempt to accept may or may not succeed if cancel arrives.
- Outgoing request, accept races cancel.
-- That is, attempt to cancel may or may not succeed if accept arrives.
- Trickle ICE Support: https://tools.ietf.org/id/draft-ietf-mmusic-trickle-ice-sip-11.html
- Unit tests for low level components
-- Transaction
-- Transport
- Integration tests for high level components
-- Session
-- Subscription

# Notes - New API

### UserAgent
* UserAgent.delegate
* TODO: UserAgent.state // Initial, Started, Stopped

* UserAgent(options);
* UserAgent.start();
* UserAgent.stop();

* UserAgent.makeURI(target) // string => URI (static)

* UserAgentDelegate.onInvite(invitation);
* UserAgentDelegate.onMessage(message);
* UserAgentDelegate.onNotify(notification);
* UserAgentDelegate.onRefer(referral);
* UserAgentDelegate.onSubscribe(subscription);

### REGISTER
* Registerer.contacts // array
* Registerer.registered // boolean
* Registerer.state // Initial, Registered, Unregistered

* Registerer(userAgent, options)
* Registerer.register(options)		
* Registerer.unregister(options)

### INVITE
* Session.data
* Session.delegate
* Session.dialog
* Session.sessionDescriptionHandler
* Session.state // Established, Establishing, Initial. Terminated, Terminating

* Session.invite(options); // Re-INVITE

* SessionDelegate.onInfo(info)
* SessionDelegate.onNotify(notify)
* SessionDelegate.onRefer(referral)

// Incoming extends Session
* Invitation.request

* Invitation.accept(options)
* Invitation.progress(options)
* Invitation.reject(options)

// Outgoing extends Session
* Inviter(userAgent, targetURI, options)
* Inviter.invite(options) // initial INVITE
* Inviter.cancel(options)

### BYE
* Byer.session

* Byer(session, options)
* Byer.bye(options)

### REFER
* Referrral.referredBy
* Referrral.referTo
* Referrral.replaces
* Referrral.request

* Referrral.accept(options);
* Referrral.reject(options);

* Referrral.makeInviter(options) // Cover for Inviter constructor, new Inviter using Referral info

* Referrer.delegate
* Referrer.session

* Referrer(session, referTo, options)
* Referrer.refer(options)

* ReferrerDelegate.onNotify(notification)	

### PUBLISH
* Publisher(userAgent, targetURI, eventType, options)
* Publisher.publish(content, options) // PUBLISH and Re-PUBLISH
* Publisher.unpublish(options)

### SUBSCRIBE
* Subscription.data
* Subscription.delegate
* Subscription.state // Initial, NotifyWait, Subscribed, Terminated

* Subscription.subscribe(options) // Re-SUBSCRIBE
* Subscription.unsubscribe(options)

* SubscriptionDelegate.onNotify(notification)

* Subscriber(userAgent, targetURI, eventType, options)
* Subscriber.subscribe(options) // SUBSCRIBE

### INFO
* INFO.request

* Info.accept(options);
* Info.reject(options);

* Infoer.session;
* Infoer(session, options);
* Infoer.info(options);

### NOTIFY
* Notification.request

* Notification.accept(options);
* Notification.reject(options);

### MESSAGE
* Message.request

* Message.accept(options);
* Message.reject(options);

* Messager(userAgent, targetURI, content, contentType, options)
* Messager.message(options)

## Delegate Pattern Example
```ts
// Our delegate interface
interface ICalendarDelegate {
  onInvitation(date: Date, appointment: Appointment): void;
  onReminder(appointment: Appointment): void;
}

// A class that wants to support events
class Calendar {
  private _delegate: ICalendarDelegate;
  constructor(delegate: ICalendarDelegate) {
    this._delegate = delegate;
  }
    
    this._delegate.onReminder(new Appointment(...
}

class Client implements ICalendarDelegate {
  private _calendar: Calendar;
  constructor() {
    // Registering event handlers via the ctor would be messy
    // without a delegate interface
    this._calendar = new Calendar(this);
  }
…
}
```


# Notes - REFER (Transfer)

The Session Initiation Protocol (SIP) Refer Method (2003)
https://tools.ietf.org/html/rfc3515
Abstract

   This document defines the REFER method.  This Session Initiation
   Protocol (SIP) extension requests that the recipient REFER to a
   resource provided in the request.  It provides a mechanism allowing
   the party sending the REFER to be notified of the outcome of the
   referenced request.  This can be used to enable many applications,
   including call transfer.

Multiple Dialog Usages in the Session Initiation Protocol (2007)
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

Session Initiation Protocol (SIP) Call Control - Transfer (2009)
https://tools.ietf.org/html/rfc5589
Abstract

   This document describes providing Call Transfer capabilities in the
   Session Initiation Protocol (SIP).  SIP extensions such as REFER and
   Replaces are used to provide a number of transfer services including
   blind transfer, consultative transfer, and attended transfer.  This
   work is part of the SIP multiparty call control framework.


SIP-Specific Event Notification (2012)
https://tools.ietf.org/html/rfc6665
Abstract

   This document describes an extension to the Session Initiation
   Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
   to provide an extensible framework by which SIP nodes can request
   notification from remote nodes indicating that certain events have
   occurred.

Explicit Subscriptions for the REFER Method (2015)
https://tools.ietf.org/html/rfc7614
Abstract

   The Session Initiation Protocol (SIP) REFER request, as defined by
   RFC 3515, triggers an implicit SIP-Specific Event Notification
   framework subscription.  Conflating the start of the subscription
   with handling the REFER request makes negotiating SUBSCRIBE
   extensions impossible and complicates avoiding SIP dialog sharing.
   This document defines extensions to REFER that remove the implicit
   subscription and, if desired, replace it with an explicit one.

Clarifications for the Use of REFER with RFC 6665 (2015)
https://tools.ietf.org/html/rfc7647
Abstract

   The SIP REFER method relies on the SIP-Specific Event Notification
   framework.  That framework was revised by RFC 6665.  This document
   highlights the implications of the requirement changes in RFC 6665,
   and updates the definition of the REFER method described in RFC 3515
   to clarify and disambiguate the impact of those changes.


Clarifications for When to Use the name-addr Production in SIP Messages (2017)
https://tools.ietf.org/html/rfc8217
Abstract

   RFC 3261 constrained several SIP header fields whose grammar contains
   the "name-addr / addr-spec" alternative to use name-addr when certain
   characters appear.  Unfortunately, it expressed the constraints with
   prose copied into each header field definition, and at least one
   header field was missed.  Further, the constraint has not been copied
   into documents defining extension headers whose grammar contains the
   alternative.

