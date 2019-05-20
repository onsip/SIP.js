"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = require("../Core/messages");
var session_1 = require("../Core/session");
var Constants_1 = require("../Constants");
var Enums_1 = require("../Enums");
var Grammar_1 = require("../Grammar");
var Session_1 = require("../Session");
var Utils_1 = require("../Utils");
var InviteClientContext = /** @class */ (function (_super) {
    __extends(InviteClientContext, _super);
    function InviteClientContext(ua, target, options, modifiers) {
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        var _this = _super.call(this, ua, target, options, modifiers) || this;
        _this.earlyMediaSessionDescriptionHandlers = new Map();
        return _this;
    }
    ////
    // BEGIN Session Overrides - roadmap is to remove all of these, but for now...
    //
    // Override Session member we want to make sure we are not using.
    InviteClientContext.prototype.acceptAndTerminate = function (message, statusCode, reasonPhrase) {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override Session member we want to make sure we are not using.
    InviteClientContext.prototype.createDialog = function (message, type, early) {
        if (early === void 0) { early = false; }
        throw new Error("Method not utilized by user agent core.");
    };
    /**
     * Sends in dialog request.
     * @param method Request method.
     * @param options Options bucket.
     */
    InviteClientContext.prototype.sendRequest = function (method, options) {
        if (options === void 0) { options = {}; }
        if (!this.session) {
            throw new Error("Session undefined.");
        }
        // Convert any "body" option to a Body.
        if (options.body) {
            options.body = messages_1.fromBodyObj(options.body);
        }
        // Convert any "receiveResponse" callback option passed to an OutgoingRequestDelegate.
        var delegate;
        var callback = options.receiveResponse;
        if (callback) {
            delegate = {
                onAccept: function (response) { return callback(response.message); },
                onProgress: function (response) { return callback(response.message); },
                onRedirect: function (response) { return callback(response.message); },
                onReject: function (response) { return callback(response.message); },
                onTrying: function (response) { return callback(response.message); }
            };
        }
        var request;
        var requestOptions = options;
        switch (method) {
            case Constants_1.C.BYE:
                request = this.session.bye(delegate, requestOptions);
                break;
            case Constants_1.C.INVITE:
                request = this.session.invite(delegate, requestOptions);
                break;
            case Constants_1.C.REFER:
                request = this.session.refer(delegate, requestOptions);
                break;
            default:
                throw new Error("Unexpected " + method + ". Method not implemented by user agent core.");
        }
        // Ported - Emit the request event
        this.emit(method.toLowerCase(), request.message);
        return this;
    };
    // Override Session member we want to make sure we are not using.
    InviteClientContext.prototype.setInvite2xxTimer = function (message, body) {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override Session member we want to make sure we are not using.
    InviteClientContext.prototype.setACKTimer = function () {
        // throw new Error("Method not utilized by user agent core.");
        // FIXME: TODO: This gets called by receiveReinvite().
        // Just prevent it from doing anything for now until we stop calling that.
        return;
    };
    // END Session Overrides
    //////
    // Override InviteClientContextBase member we want to make sure we are not using.
    InviteClientContext.prototype.receiveInviteResponse = function (message) {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override InviteClientContextBase member we want to make sure we are not using.
    InviteClientContext.prototype.receiveNonInviteResponse = function (message) {
        throw new Error("Method not utilized by user agent core.");
    };
    // Override InviteClientContextBase member we want to make sure we are not using.
    InviteClientContext.prototype.receiveResponse = function (message) {
        throw new Error("Method not utilized by user agent core.");
    };
    /**
     * Cancel an unaccepted outgoing INVITE request.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    InviteClientContext.prototype.cancel = function (options) {
        if (options === void 0) { options = {}; }
        return _super.prototype.cancel.call(this, options);
    };
    /**
     * Create an outgoing INVITE request and send it to the target.
     */
    InviteClientContext.prototype.invite = function () {
        if (this.outgoingInviteRequest) {
            throw new Error("Outgoing invite request already defined. Did you call invite() more than once?");
        }
        return _super.prototype.invite.call(this);
    };
    /**
     * This public function here in the service of a hack in a parent class. It should be protected.
     * It will, hopefully, go away altogether at somepoint. Meanwhile, please do not call it.
     */
    InviteClientContext.prototype.send = function () {
        this.sendInvite();
        return this;
    };
    /**
     * Cancel an unaccepted outgoing INVITE request or send BYE if established session.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    InviteClientContext.prototype.terminate = function (options) {
        if (!this.outgoingInviteRequest) {
            throw new Error("Outgoing invite request undefined. Did you call terminate() without calling invite() first?");
        }
        return _super.prototype.terminate.call(this, options);
    };
    /**
     * Incoming request handler.
     * @param message Incoming request.
     */
    InviteClientContext.prototype.receiveRequest = function (message) {
        this.logger.log("INVITE client context received " + message.method + ".");
        _super.prototype.receiveRequest.call(this, message);
    };
    /**
     * 13.2.1 Creating the Initial INVITE
     *
     * Since the initial INVITE represents a request outside of a dialog,
     * its construction follows the procedures of Section 8.1.1.  Additional
     * processing is required for the specific case of INVITE.
     *
     * An Allow header field (Section 20.5) SHOULD be present in the INVITE.
     * It indicates what methods can be invoked within a dialog, on the UA
     * sending the INVITE, for the duration of the dialog.  For example, a
     * UA capable of receiving INFO requests within a dialog [34] SHOULD
     * include an Allow header field listing the INFO method.
     *
     * A Supported header field (Section 20.37) SHOULD be present in the
     * INVITE.  It enumerates all the extensions understood by the UAC.
     *
     * An Accept (Section 20.1) header field MAY be present in the INVITE.
     * It indicates which Content-Types are acceptable to the UA, in both
     * the response received by it, and in any subsequent requests sent to
     * it within dialogs established by the INVITE.  The Accept header field
     * is especially useful for indicating support of various session
     * description formats.
     *
     * The UAC MAY add an Expires header field (Section 20.19) to limit the
     * validity of the invitation.  If the time indicated in the Expires
     * header field is reached and no final answer for the INVITE has been
     * received, the UAC core SHOULD generate a CANCEL request for the
     * INVITE, as per Section 9.
     *
     * A UAC MAY also find it useful to add, among others, Subject (Section
     * 20.36), Organization (Section 20.25) and User-Agent (Section 20.41)
     * header fields.  They all contain information related to the INVITE.
     *
     * The UAC MAY choose to add a message body to the INVITE.  Section
     * 8.1.1.10 deals with how to construct the header fields -- Content-
     * Type among others -- needed to describe the message body.
     *
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     */
    InviteClientContext.prototype.sendInvite = function () {
        //    There are special rules for message bodies that contain a session
        //    description - their corresponding Content-Disposition is "session".
        //    SIP uses an offer/answer model where one UA sends a session
        //    description, called the offer, which contains a proposed description
        //    of the session.  The offer indicates the desired communications means
        //    (audio, video, games), parameters of those means (such as codec
        //    types) and addresses for receiving media from the answerer.  The
        //    other UA responds with another session description, called the
        //    answer, which indicates which communications means are accepted, the
        //    parameters that apply to those means, and addresses for receiving
        //    media from the offerer. An offer/answer exchange is within the
        //    context of a dialog, so that if a SIP INVITE results in multiple
        //    dialogs, each is a separate offer/answer exchange.  The offer/answer
        //    model defines restrictions on when offers and answers can be made
        //    (for example, you cannot make a new offer while one is in progress).
        //    This results in restrictions on where the offers and answers can
        //    appear in SIP messages.  In this specification, offers and answers
        //    can only appear in INVITE requests and responses, and ACK.  The usage
        //    of offers and answers is further restricted.  For the initial INVITE
        //    transaction, the rules are:
        //
        //       o  The initial offer MUST be in either an INVITE or, if not there,
        //          in the first reliable non-failure message from the UAS back to
        //          the UAC.  In this specification, that is the final 2xx
        //          response.
        //
        //       o  If the initial offer is in an INVITE, the answer MUST be in a
        //          reliable non-failure message from UAS back to UAC which is
        //          correlated to that INVITE.  For this specification, that is
        //          only the final 2xx response to that INVITE.  That same exact
        //          answer MAY also be placed in any provisional responses sent
        //          prior to the answer.  The UAC MUST treat the first session
        //          description it receives as the answer, and MUST ignore any
        //          session descriptions in subsequent responses to the initial
        //          INVITE.
        //
        //       o  If the initial offer is in the first reliable non-failure
        //          message from the UAS back to UAC, the answer MUST be in the
        //          acknowledgement for that message (in this specification, ACK
        //          for a 2xx response).
        //
        //       o  After having sent or received an answer to the first offer, the
        //          UAC MAY generate subsequent offers in requests based on rules
        //          specified for that method, but only if it has received answers
        //          to any previous offers, and has not sent any offers to which it
        //          hasn't gotten an answer.
        //
        //       o  Once the UAS has sent or received an answer to the initial
        //          offer, it MUST NOT generate subsequent offers in any responses
        //          to the initial INVITE.  This means that a UAS based on this
        //          specification alone can never generate subsequent offers until
        //          completion of the initial transaction.
        //
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        var _this = this;
        // 5 The Offer/Answer Model and PRACK
        //
        //    RFC 3261 describes guidelines for the sets of messages in which
        //    offers and answers [3] can appear.  Based on those guidelines, this
        //    extension provides additional opportunities for offer/answer
        //    exchanges.
        //    If the INVITE contained an offer, the UAS MAY generate an answer in a
        //    reliable provisional response (assuming these are supported by the
        //    UAC).  That results in the establishment of the session before
        //    completion of the call.  Similarly, if a reliable provisional
        //    response is the first reliable message sent back to the UAC, and the
        //    INVITE did not contain an offer, one MUST appear in that reliable
        //    provisional response.
        //    If the UAC receives a reliable provisional response with an offer
        //    (this would occur if the UAC sent an INVITE without an offer, in
        //    which case the first reliable provisional response will contain the
        //    offer), it MUST generate an answer in the PRACK.  If the UAC receives
        //    a reliable provisional response with an answer, it MAY generate an
        //    additional offer in the PRACK.  If the UAS receives a PRACK with an
        //    offer, it MUST place the answer in the 2xx to the PRACK.
        //    Once an answer has been sent or received, the UA SHOULD establish the
        //    session based on the parameters of the offer and answer, even if the
        //    original INVITE itself has not been responded to.
        //    If the UAS had placed a session description in any reliable
        //    provisional response that is unacknowledged when the INVITE is
        //    accepted, the UAS MUST delay sending the 2xx until the provisional
        //    response is acknowledged.  Otherwise, the reliability of the 1xx
        //    cannot be guaranteed, and reliability is needed for proper operation
        //    of the offer/answer exchange.
        //    All user agents that support this extension MUST support all
        //    offer/answer exchanges that are possible based on the rules in
        //    Section 13.2 of RFC 3261, based on the existence of INVITE and PRACK
        //    as requests, and 2xx and reliable 1xx as non-failure reliable
        //    responses.
        //
        // https://tools.ietf.org/html/rfc3262#section-5
        ////
        // The Offer/Answer Model Implementation
        //
        // The offer/answer model is straight forward, but one MUST READ the specifications...
        //
        // 13.2.1 Creating the Initial INVITE (paragraph 8 in particular)
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // 5 The Offer/Answer Model and PRACK
        // https://tools.ietf.org/html/rfc3262#section-5
        //
        // Session Initiation Protocol (SIP) Usage of the Offer/Answer Model
        // https://tools.ietf.org/html/rfc6337
        //
        // *** IMPORTANT IMPLEMENTATION CHOICES ***
        //
        // TLDR...
        //
        //  1) Only one offer/answer exchange permitted during initial INVITE.
        //  2) No "early media" if the initial offer is in an INVITE.
        //
        //
        // 1) Initial Offer/Answer Restriction.
        //
        // Our implementation replaces the following bullet point...
        //
        // o  After having sent or received an answer to the first offer, the
        //    UAC MAY generate subsequent offers in requests based on rules
        //    specified for that method, but only if it has received answers
        //    to any previous offers, and has not sent any offers to which it
        //    hasn't gotten an answer.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // ...with...
        //
        // o  After having sent or received an answer to the first offer, the
        //    UAC MUST NOT generate subsequent offers in requests based on rules
        //    specified for that method.
        //
        // ...which in combination with this bullet point...
        //
        // o  Once the UAS has sent or received an answer to the initial
        //    offer, it MUST NOT generate subsequent offers in any responses
        //    to the initial INVITE.  This means that a UAS based on this
        //    specification alone can never generate subsequent offers until
        //    completion of the initial transaction.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // ...ensures that EXACTLY ONE offer/answer exchange will occur
        // during an initial out of dialog INVITE request made by our UAC.
        //
        //
        // 2) Early Media Restriction.
        //
        // While our implementation adheres to the following bullet point...
        //
        // o  If the initial offer is in an INVITE, the answer MUST be in a
        //    reliable non-failure message from UAS back to UAC which is
        //    correlated to that INVITE.  For this specification, that is
        //    only the final 2xx response to that INVITE.  That same exact
        //    answer MAY also be placed in any provisional responses sent
        //    prior to the answer.  The UAC MUST treat the first session
        //    description it receives as the answer, and MUST ignore any
        //    session descriptions in subsequent responses to the initial
        //    INVITE.
        // https://tools.ietf.org/html/rfc3261#section-13.2.1
        //
        // We have made the following implementation decision with regard to early media...
        //
        // o  If the initial offer is in the INVITE, the answer from the
        //    UAS back to the UAC will establish a media session only
        //    only after the final 2xx response to that INVITE is received.
        //
        // The reason for this decision is rooted in a restriction currently
        // inherent in WebRTC. Specifically, while a SIP INVITE request with an
        // initial offer may fork resulting in more than one provisional answer,
        // there is currently no easy/good way to to "fork" an offer generated
        // by a peer connection. In particular, a WebRTC offer currently may only
        // be matched with one answer and we have no good way to know which
        // "provisional answer" is going to be the "final answer". So we have
        // decided to punt and not create any "early media" sessions in this case.
        //
        // The upshot is that if you want "early media", you must not put the
        // initial offer in the INVITE. Instead, force the UAS to provide the
        // initial offer by sending an INVITE without an offer. In the WebRTC
        // case this allows us to create a unique peer connection with a unique
        // answer for every provisional offer with "early media" on all of them.
        ////
        ////
        // ROADMAP: The Offer/Answer Model Implementation
        //
        // The "no early media if offer in INVITE" implementation is not a
        // welcome one. The masses want it. The want it and they want it
        // to work for WebRTC (so they want to have their cake and eat too).
        //
        // So while we currently cannot make the offer in INVITE+forking+webrtc
        // case work, we decided to do the following...
        //
        // 1) modify SDH Factory to provide an initial offer without giving us the SDH, and then...
        // 2) stick that offer in the initial INVITE, and when 183 with initial answer is received...
        // 3) ask SDH Factory if it supports "earlyRemoteAnswer"
        //   a) if true, ask SDH Factory to createSDH(localOffer).then((sdh) => sdh.setDescription(remoteAnswer)
        //   b) if false, defer getting a SDH until 2xx response is received
        //
        // Our supplied WebRTC SDH will default to behavior 3b which works in forking environment (without)
        // early media if initial offer is in the INVITE). We will, however, provide an "inviteWillNotFork"
        // option which if set to "true" will have our supplied WebRTC SDH behave in the 3a manner.
        // That will result in
        //  - early media working with initial offer in the INVITE, and...
        //  - if the INVITE forks, the session terminating with an ERROR that reads like
        //    "You set 'inviteWillNotFork' to true but the INVITE forked. You can't eat your cake, and have it too."
        //  - furthermore, we accept that users will report that error to us as "bug" regardless
        //
        // So, SDH Factory is going to end up with a new interface along the lines of...
        //
        // interface SessionDescriptionHandlerFactory {
        //   makeLocalOffer(): Promise<ContentTypeAndBody>;
        //   makeSessionDescriptionHandler(
        //     initialOffer: ContentTypeAndBody, offerType: "local" | "remote"
        //   ): Promise<SessionDescriptionHandler>;
        //   supportsEarlyRemoteAnswer: boolean;
        //   supportsContentType(contentType: string): boolean;
        //   getDescription(description: ContentTypeAndBody): Promise<ContentTypeAndBody>
        //   setDescription(description: ContentTypeAndBody): Promise<void>
        // }
        //
        // We should be able to get rid of all the hasOffer/hasAnswer tracking code and otherwise code
        // it up to the same interaction with the SDH Factory and SDH regardless of signaling scenario.
        ////
        if (!this.ua.userAgentCore) {
            throw new Error("User agent core undefined.");
        }
        // Send the INVITE request.
        this.outgoingInviteRequest = this.ua.userAgentCore.invite(this.request, {
            onAccept: function (inviteResponse) { return _this.onAccept(inviteResponse); },
            onProgress: function (inviteResponse) { return _this.onProgress(inviteResponse); },
            onRedirect: function (inviteResponse) { return _this.onRedirect(inviteResponse); },
            onReject: function (inviteResponse) { return _this.onReject(inviteResponse); },
            onTrying: function (inviteResponse) { return _this.onTrying(inviteResponse); }
        });
    };
    InviteClientContext.prototype.ackAndBye = function (inviteResponse, session, statusCode, reasonPhrase) {
        if (!this.ua.userAgentCore) {
            throw new Error("Method requires user agent core.");
        }
        var extraHeaders = [];
        if (statusCode) {
            extraHeaders.push("Reason: " + Utils_1.Utils.getReasonHeaderValue(statusCode, reasonPhrase));
        }
        var outgoingAckRequest = inviteResponse.ack();
        this.emit("ack", outgoingAckRequest.message);
        var outgoingByeRequest = session.bye(undefined, { extraHeaders: extraHeaders });
        this.emit("bye", outgoingByeRequest.message);
    };
    InviteClientContext.prototype.disposeEarlyMedia = function () {
        if (!this.earlyMediaSessionDescriptionHandlers) {
            throw new Error("Early media session description handlers undefined.");
        }
        this.earlyMediaSessionDescriptionHandlers.forEach(function (sessionDescriptionHandler) {
            sessionDescriptionHandler.close();
        });
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 2xx response.
     */
    InviteClientContext.prototype.onAccept = function (inviteResponse) {
        var _this = this;
        if (!this.earlyMediaSessionDescriptionHandlers) {
            throw new Error("Early media session description handlers undefined.");
        }
        var response = inviteResponse.message;
        var session = inviteResponse.session;
        // Our transaction layer is "non-standard" in that it will only
        // pass us a 2xx response once per branch, so there is no need to
        // worry about dealing with 2xx retransmissions. However, we can
        // and do still get 2xx responses for multiple branches (when an
        // INVITE is forked) which may create multiple confirmed dialogs.
        // Herein we are acking and sending a bye to any confirmed dialogs
        // which arrive beyond the first one. This is the desired behavior
        // for most applications (but certainly not all).
        // If we already received a confirmed dialog, ack & bye this session.
        if (this.session) {
            this.ackAndBye(inviteResponse, session);
            return;
        }
        // If the user requested cancellation, ack & bye this session.
        if (this.isCanceled) {
            this.ackAndBye(inviteResponse, session);
            this.emit("bye", this.request); // FIXME: Ported this odd second "bye" emit
            return;
        }
        // Ported behavior.
        if (response.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = Grammar_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
        }
        // We have a confirmed dialog.
        this.session = session;
        this.session.delegate = {
            onAck: function (ackRequest) { return _this.receiveRequest(ackRequest.message); },
            onBye: function (byeRequest) { return _this.receiveRequest(byeRequest.message); },
            onInfo: function (infoRequest) { return _this.receiveRequest(infoRequest.message); },
            onInvite: function (inviteRequest) { return _this.receiveRequest(inviteRequest.message); },
            onNotify: function (notifyRequest) { return _this.receiveRequest(notifyRequest.message); },
            onPrack: function (prackRequest) { return _this.receiveRequest(prackRequest.message); },
            onRefer: function (referRequest) { return _this.receiveRequest(referRequest.message); }
        };
        switch (session.signalingState) {
            case session_1.SignalingState.Initial:
                // INVITE without Offer, so MUST have Offer at this point, so invalid state.
                this.ackAndBye(inviteResponse, session, 400, "Missing session description");
                this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                break;
            case session_1.SignalingState.HaveLocalOffer:
                // INVITE with Offer, so MUST have Answer at this point, so invalid state.
                this.ackAndBye(inviteResponse, session, 400, "Missing session description");
                this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                break;
            case session_1.SignalingState.HaveRemoteOffer:
                // INVITE without Offer, received offer in 2xx, so MUST send Answer in ACK.
                var sdh_1 = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
                this.sessionDescriptionHandler = sdh_1;
                this.emit("SessionDescriptionHandler-created", this.sessionDescriptionHandler);
                if (!sdh_1.hasDescription(response.getHeader("Content-Type") || "")) {
                    this.ackAndBye(inviteResponse, session, 400, "Missing session description");
                    this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    break;
                }
                this.hasOffer = true;
                sdh_1
                    .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
                    .then(function () { return sdh_1.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers); })
                    .then(function (description) {
                    if (_this.isCanceled || _this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return;
                    }
                    _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    _this.hasAnswer = true;
                    var body = {
                        contentDisposition: "session", contentType: description.contentType, content: description.body
                    };
                    var ackRequest = inviteResponse.ack({ body: body });
                    _this.emit("ack", ackRequest.message);
                    _this.accepted(response);
                })
                    .catch(function (e) {
                    if (e.type === Enums_1.TypeStrings.SessionDescriptionHandlerError) {
                        _this.logger.warn("invalid description");
                        _this.logger.warn(e.toString());
                        // TODO: This message is inconsistent
                        _this.acceptAndTerminate(response, 488, "Invalid session description");
                        _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                    }
                    else {
                        throw e;
                    }
                });
                break;
            case session_1.SignalingState.Stable:
                // This session has completed an initial offer/answer exchange...
                var options_1;
                if (this.renderbody && this.rendertype) {
                    options_1 = { body: { contentDisposition: "render", contentType: this.rendertype, content: this.renderbody } };
                }
                // If INVITE with Offer and we have been waiting till now to apply the answer.
                if (this.hasOffer && !this.hasAnswer) {
                    if (!this.sessionDescriptionHandler) {
                        throw new Error("Session description handler undefined.");
                    }
                    var answer = session.answer;
                    if (!answer) {
                        throw new Error("Answer is undefined.");
                    }
                    this.sessionDescriptionHandler
                        .setDescription(answer.content, this.sessionDescriptionHandlerOptions, this.modifiers)
                        .then(function () {
                        _this.hasAnswer = true;
                        _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                        var ackRequest = inviteResponse.ack(options_1);
                        _this.emit("ack", ackRequest.message);
                        _this.accepted(response);
                    })
                        .catch(function (error) {
                        _this.logger.error(error);
                        _this.ackAndBye(inviteResponse, session, 488, "Not Acceptable Here");
                        _this.failed(response, Constants_1.C.causes.BAD_MEDIA_DESCRIPTION);
                        // FIME: DON'T EAT UNHANDLED ERRORS!
                    });
                }
                else {
                    // Otherwise INVITE with or without Offer and we have already completed the initial exchange.
                    this.sessionDescriptionHandler = this.earlyMediaSessionDescriptionHandlers.get(session.id);
                    if (!this.sessionDescriptionHandler) {
                        throw new Error("Session description handler undefined.");
                    }
                    this.earlyMediaSessionDescriptionHandlers.delete(session.id);
                    this.hasOffer = true;
                    this.hasAnswer = true;
                    this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var ackRequest = inviteResponse.ack();
                    this.emit("ack", ackRequest.message);
                    this.accepted(response);
                }
                break;
            case session_1.SignalingState.Closed:
                // Dialog has terminated.
                break;
            default:
                throw new Error("Unknown session signaling state.");
        }
        this.disposeEarlyMedia();
    };
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse 1xx response.
     */
    InviteClientContext.prototype.onProgress = function (inviteResponse) {
        var _this = this;
        if (!this.outgoingInviteRequest) {
            throw new Error("Outgoing INVITE request undefined.");
        }
        if (!this.earlyMediaSessionDescriptionHandlers) {
            throw new Error("Early media session description handlers undefined.");
        }
        var response = inviteResponse.message;
        var session = inviteResponse.session;
        // Ported - User requested cancellation.
        if (this.isCanceled) {
            this.outgoingInviteRequest.cancel(this.cancelReason);
            this.canceled();
            return;
        }
        // Ported - Set status.
        this.status = Enums_1.SessionStatus.STATUS_1XX_RECEIVED;
        // Ported - Set assertedIdentity.
        if (response.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = Grammar_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
        }
        // The provisional response MUST establish a dialog if one is not yet created.
        // https://tools.ietf.org/html/rfc3262#section-4
        if (!session) {
            // A response with a to tag MUST create a session (should never get here).
            throw new Error("Session undefined.");
        }
        // If a provisional response is received for an initial request, and
        // that response contains a Require header field containing the option
        // tag 100rel, the response is to be sent reliably.  If the response is
        // a 100 (Trying) (as opposed to 101 to 199), this option tag MUST be
        // ignored, and the procedures below MUST NOT be used.
        // https://tools.ietf.org/html/rfc3262#section-4
        var requireHeader = response.getHeader("require");
        var rseqHeader = response.getHeader("rseq");
        var rseq = requireHeader && requireHeader.includes("100rel") && rseqHeader ? Number(rseqHeader) : undefined;
        var responseReliable = !!rseq;
        var extraHeaders = [];
        if (responseReliable) {
            extraHeaders.push("RAck: " + response.getHeader("rseq") + " " + response.getHeader("cseq"));
        }
        // INVITE without Offer and session still has no offer (and no answer).
        if (session.signalingState === session_1.SignalingState.Initial) {
            // Similarly, if a reliable provisional
            // response is the first reliable message sent back to the UAC, and the
            // INVITE did not contain an offer, one MUST appear in that reliable
            // provisional response.
            // https://tools.ietf.org/html/rfc3262#section-5
            if (responseReliable) {
                this.logger.warn("First reliable provisional response received MUST contain an offer when INVITE does not contain an offer.");
                // FIXME: Known popular UA's currently end up here...
                inviteResponse.prack({ extraHeaders: extraHeaders });
            }
            this.emit("progress", response);
            return;
        }
        // INVITE with Offer and session only has that initial local offer.
        if (session.signalingState === session_1.SignalingState.HaveLocalOffer) {
            if (responseReliable) {
                inviteResponse.prack({ extraHeaders: extraHeaders });
            }
            this.emit("progress", response);
            return;
        }
        // INVITE without Offer and received initial offer in provisional response
        if (session.signalingState === session_1.SignalingState.HaveRemoteOffer) {
            // The initial offer MUST be in either an INVITE or, if not there,
            // in the first reliable non-failure message from the UAS back to
            // the UAC.
            // https://tools.ietf.org/html/rfc3261#section-13.2.1
            // According to Section 13.2.1 of [RFC3261], 'The first reliable
            // non-failure message' must have an offer if there is no offer in the
            // INVITE request.  This means that the User Agent (UA) that receives
            // the INVITE request without an offer must include an offer in the
            // first reliable response with 100rel extension.  If no reliable
            // provisional response has been sent, the User Agent Server (UAS) must
            // include an offer when sending 2xx response.
            // https://tools.ietf.org/html/rfc6337#section-2.2
            if (!responseReliable) {
                this.logger.warn("Non-reliable provisional response MUST NOT contain an initial offer, discarding response.");
                return;
            }
            // If the initial offer is in the first reliable non-failure
            // message from the UAS back to UAC, the answer MUST be in the
            // acknowledgement for that message
            var sdh_2 = this.sessionDescriptionHandlerFactory(this, this.ua.configuration.sessionDescriptionHandlerFactoryOptions || {});
            this.emit("SessionDescriptionHandler-created", sdh_2);
            this.earlyMediaSessionDescriptionHandlers.set(session.id, sdh_2);
            sdh_2
                .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
                .then(function () { return sdh_2.getDescription(_this.sessionDescriptionHandlerOptions, _this.modifiers); })
                .then(function (description) {
                var body = {
                    contentDisposition: "session", contentType: description.contentType, content: description.body
                };
                inviteResponse.prack({ extraHeaders: extraHeaders, body: body });
                _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                _this.emit("progress", response);
            })
                .catch(function (error) {
                if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                    return;
                }
                _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
            });
            return;
        }
        // This session has completed an initial offer/answer exchange, so...
        // - INVITE with SDP and this provisional response MAY be reliable
        // - INVITE without SDP and this provisional response MAY be reliable
        if (session.signalingState === session_1.SignalingState.Stable) {
            if (responseReliable) {
                inviteResponse.prack({ extraHeaders: extraHeaders });
            }
            // Note: As documented, no early media if offer was in INVITE, so nothing to be done.
            // FIXME: TODO: Add a flag/hack to allow early media in this case. There are people
            //              in non-forking environments (think straight to FreeSWITCH) who want
            //              early media on a 183. Not sure how to actually make it work, basically
            //              something like...
            if (0 /* flag */ && this.hasOffer && !this.hasAnswer && this.sessionDescriptionHandler) {
                this.hasAnswer = true;
                this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                this.sessionDescriptionHandler
                    .setDescription(response.body, this.sessionDescriptionHandlerOptions, this.modifiers)
                    .then(function () {
                    _this.status = Enums_1.SessionStatus.STATUS_EARLY_MEDIA;
                })
                    .catch(function (error) {
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return;
                    }
                    _this.failed(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                    _this.terminated(undefined, Constants_1.C.causes.WEBRTC_ERROR);
                });
            }
            this.emit("progress", response);
            return;
        }
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 3xx response.
     */
    InviteClientContext.prototype.onRedirect = function (inviteResponse) {
        this.disposeEarlyMedia();
        var response = inviteResponse.message;
        var statusCode = response.statusCode;
        var cause = Utils_1.Utils.sipErrorCause(statusCode || 0);
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 4xx, 5xx, or 6xx response.
     */
    InviteClientContext.prototype.onReject = function (inviteResponse) {
        this.disposeEarlyMedia();
        var response = inviteResponse.message;
        var statusCode = response.statusCode;
        var cause = Utils_1.Utils.sipErrorCause(statusCode || 0);
        this.rejected(response, cause);
        this.failed(response, cause);
        this.terminated(response, cause);
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 100 response.
     */
    InviteClientContext.prototype.onTrying = function (inviteResponse) {
        this.received100 = true;
        this.emit("progress", inviteResponse.message);
    };
    return InviteClientContext;
}(Session_1.InviteClientContext));
exports.InviteClientContext = InviteClientContext;
