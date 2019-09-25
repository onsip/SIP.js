"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Constants_1 = require("../Constants");
var core_1 = require("../core");
var Enums_1 = require("../Enums");
var Exceptions_1 = require("../Exceptions");
var Utils_1 = require("../Utils");
var session_1 = require("./session");
var session_state_1 = require("./session-state");
var user_agent_options_1 = require("./user-agent-options");
/**
 * An inviter offers to establish a {@link Session} (outgoing INVITE).
 * @public
 */
var Inviter = /** @class */ (function (_super) {
    tslib_1.__extends(Inviter, _super);
    /**
     * Constructs a new instance of the `Inviter` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param options - Options bucket. See {@link InviterOptions} for details.
     */
    function Inviter(userAgent, targetURI, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, userAgent, options) || this;
        /** @internal */
        _this.body = undefined;
        _this.earlyMediaSessionDescriptionHandlers = new Map();
        // Default options params
        options.params = options.params || {};
        // Check Session Status
        if (_this.status !== Enums_1.SessionStatus.STATUS_NULL) {
            throw new Exceptions_1.Exceptions.InvalidStateError(_this.status);
        }
        // ClientContext properties
        _this.type = Enums_1.TypeStrings.InviteClientContext;
        _this.logger = userAgent.getLogger("sip.inviter");
        if (options.body) {
            _this.body = {
                body: options.body,
                contentType: options.contentType ? options.contentType : "application/sdp"
            };
        }
        // Anonymous call
        var anonymous = options.anonymous || false;
        if (anonymous && userAgent.configuration.uri) {
            options.params.fromDisplayName = "Anonymous";
            options.params.fromUri = "sip:anonymous@anonymous.invalid";
        }
        // From Tag
        var fromTag = Utils_1.Utils.newTag();
        // Contact
        // Do not add ;ob in initial forming dialog requests if the registration over
        // the current connection got a GRUU URI.
        var contact = userAgent.contact.toString({
            anonymous: anonymous,
            outbound: anonymous ? !userAgent.contact.tempGruu : !userAgent.contact.pubGruu
        });
        // Params
        var params = options.params || {};
        params.fromTag = fromTag;
        // URIs
        var fromURI = userAgent.userAgentCore.configuration.aor;
        if (options.params.fromUri) {
            fromURI =
                (typeof options.params.fromUri === "string") ?
                    core_1.Grammar.URIParse(options.params.fromUri) :
                    options.params.fromUri;
        }
        if (!fromURI) {
            throw new TypeError("Invalid from URI: " + options.params.fromUri);
        }
        var toURI = targetURI;
        if (options.params.toUri) {
            toURI =
                (typeof options.params.toUri === "string") ?
                    core_1.Grammar.URIParse(options.params.toUri) :
                    options.params.toUri;
        }
        if (!toURI) {
            throw new TypeError("Invalid to URI: " + options.params.toUri);
        }
        // Extra headers
        var extraHeaders = (options.extraHeaders || []).slice();
        if (anonymous && userAgent.configuration.uri) {
            extraHeaders.push("P-Preferred-Identity: " + userAgent.configuration.uri.toString());
            extraHeaders.push("Privacy: id");
        }
        extraHeaders.push("Contact: " + contact);
        // This is UA.C.ALLOWED_METHODS, removed to get around circular dependency
        extraHeaders.push("Allow: " + [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ].toString());
        if (userAgent.configuration.sipExtension100rel === user_agent_options_1.SIPExtension.Required) {
            extraHeaders.push("Require: 100rel");
        }
        if (userAgent.configuration.sipExtensionReplaces === user_agent_options_1.SIPExtension.Required) {
            extraHeaders.push("Require: replaces");
        }
        var body;
        if (_this.body) {
            body = Utils_1.Utils.fromBodyObj(_this.body);
        }
        // Request
        _this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(_this.method, targetURI, fromURI, toURI, params, extraHeaders, body);
        if (!_this.request.from) {
            throw new Error("From undefined.");
        }
        if (!_this.request.to) {
            throw new Error("From undefined.");
        }
        _this.localIdentity = _this.request.from;
        _this.remoteIdentity = _this.request.to;
        // Options
        options.params = params;
        options.extraHeaders = extraHeaders;
        // Session properties
        _this.contact = contact;
        _this.fromTag = fromTag;
        _this.id = _this.request.callId + _this.fromTag;
        _this.onInfo = options.onInfo;
        _this.passedOptions = options; // Save for later to use with refer
        _this.renderbody = options.renderbody || undefined;
        _this.rendertype = options.rendertype || "text/plain";
        _this.sessionDescriptionHandlerModifiers = options.SessionDescriptionHandlerModifiers || [];
        _this.sessionDescriptionHandlerOptions = options.sessionDescriptionHandlerOptions || {};
        // InviteClientContext properties
        _this.inviteWithoutSdp = options.inviteWithoutSdp || false;
        _this.isCanceled = false;
        _this.earlyMedia = options.earlyMedia || false;
        userAgent.applicants[_this.toString()] = _this;
        return _this;
    }
    /**
     * Called to cleanup session after terminated.
     * Using it here just to dispose of early media.
     * @internal
     */
    Inviter.prototype.close = function () {
        this.disposeEarlyMedia();
        _super.prototype.close.call(this);
    };
    /**
     * Cancels the INVITE request.
     * @param options - Options bucket.
     */
    Inviter.prototype.cancel = function (options) {
        if (options === void 0) { options = {}; }
        this.logger.log("Inviter.cancel");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial && this.state !== session_state_1.SessionState.Establishing) {
            var error = new Error("Invalid session state " + this.state);
            this.logger.error(error.message);
            return Promise.reject(error);
        }
        // canceled has some special cases
        if (this.isCanceled) {
            throw new Error("Already canceled.");
        }
        this.isCanceled = true;
        // transition state
        this.stateTransition(session_state_1.SessionState.Terminating);
        // cleanup media as needed
        this.disposeEarlyMedia();
        if (this.sessionDescriptionHandler) {
            this.sessionDescriptionHandler.close();
        }
        if (this.outgoingInviteRequest) {
            // the CANCEL may not be respected by peer(s), so don't transition to terminated
            var cancelReason = void 0;
            if (options.statusCode && options.reasonPhrase) {
                cancelReason = Utils_1.Utils.getCancelReason(options.statusCode, options.reasonPhrase);
            }
            this.outgoingInviteRequest.cancel(cancelReason, options);
        }
        else {
            this.logger.warn("Canceled session before INVITE was sent");
            this.stateTransition(session_state_1.SessionState.Terminated);
        }
        return Promise.resolve();
    };
    /**
     * Sends the INVITE request.
     * @remarks
     * TLDR...
     *  1) Only one offer/answer exchange permitted during initial INVITE.
     *  2) No "early media" if the initial offer is in an INVITE (default behavior).
     *  3) If "early media" and the initial offer is in an INVITE, no INVITE forking.
     *
     * 1) Only one offer/answer exchange permitted during initial INVITE.
     *
     * Our implementation replaces the following bullet point...
     *
     * o  After having sent or received an answer to the first offer, the
     *    UAC MAY generate subsequent offers in requests based on rules
     *    specified for that method, but only if it has received answers
     *    to any previous offers, and has not sent any offers to which it
     *    hasn't gotten an answer.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * ...with...
     *
     * o  After having sent or received an answer to the first offer, the
     *    UAC MUST NOT generate subsequent offers in requests based on rules
     *    specified for that method.
     *
     * ...which in combination with this bullet point...
     *
     * o  Once the UAS has sent or received an answer to the initial
     *    offer, it MUST NOT generate subsequent offers in any responses
     *    to the initial INVITE.  This means that a UAS based on this
     *    specification alone can never generate subsequent offers until
     *    completion of the initial transaction.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * ...ensures that EXACTLY ONE offer/answer exchange will occur
     * during an initial out of dialog INVITE request made by our UAC.
     *
     *
     * 2) No "early media" if the initial offer is in an INVITE (default behavior).
     *
     * While our implementation adheres to the following bullet point...
     *
     * o  If the initial offer is in an INVITE, the answer MUST be in a
     *    reliable non-failure message from UAS back to UAC which is
     *    correlated to that INVITE.  For this specification, that is
     *    only the final 2xx response to that INVITE.  That same exact
     *    answer MAY also be placed in any provisional responses sent
     *    prior to the answer.  The UAC MUST treat the first session
     *    description it receives as the answer, and MUST ignore any
     *    session descriptions in subsequent responses to the initial
     *    INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * We have made the following implementation decision with regard to early media...
     *
     * o  If the initial offer is in the INVITE, the answer from the
     *    UAS back to the UAC will establish a media session only
     *    only after the final 2xx response to that INVITE is received.
     *
     * The reason for this decision is rooted in a restriction currently
     * inherent in WebRTC. Specifically, while a SIP INVITE request with an
     * initial offer may fork resulting in more than one provisional answer,
     * there is currently no easy/good way to to "fork" an offer generated
     * by a peer connection. In particular, a WebRTC offer currently may only
     * be matched with one answer and we have no good way to know which
     * "provisional answer" is going to be the "final answer". So we have
     * decided to punt and not create any "early media" sessions in this case.
     *
     * The upshot is that if you want "early media", you must not put the
     * initial offer in the INVITE. Instead, force the UAS to provide the
     * initial offer by sending an INVITE without an offer. In the WebRTC
     * case this allows us to create a unique peer connection with a unique
     * answer for every provisional offer with "early media" on all of them.
     *
     *
     * 3) If "early media" and the initial offer is in an INVITE, no INVITE forking.
     *
     * The default behaviour may be altered and "early media" utilized if the
     * initial offer is in the an INVITE by setting the `earlyMedia` options.
     * However in that case the INVITE request MUST NOT fork. This allows for
     * "early media" in environments where the forking behaviour of the SIP
     * servers being utilized is configured to disallow forking.
     */
    Inviter.prototype.invite = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.logger.log("Inviter.invite");
        // validate state
        if (this.state !== session_state_1.SessionState.Initial) {
            // re-invite
            return _super.prototype.invite.call(this, options);
        }
        if (!this.id) {
            throw new Error("Session id undefined.");
        }
        // save the session into the user agent sessions collection.
        this.userAgent.sessions[this.id] = this;
        // just send an INVITE with no sdp...
        if (options.withoutSdp || this.inviteWithoutSdp) {
            if (this.renderbody && this.rendertype) {
                this.request.body = { contentType: this.rendertype, body: this.renderbody };
            }
            // transition state
            this.stateTransition(session_state_1.SessionState.Establishing);
            this.status = Enums_1.SessionStatus.STATUS_INVITE_SENT;
            return Promise.resolve(this.sendInvite(options));
        }
        // get an offer and send it in an INVITE
        var offerOptions = {
            sessionDescriptionHandlerOptions: this.sessionDescriptionHandlerOptions,
            sessionDescriptionHandlerModifiers: this.sessionDescriptionHandlerModifiers
        };
        return this.getOffer(offerOptions)
            .then(function (body) {
            // TODO: Review error handling...
            // There are some race conditions which can occur, all of which will cause stateTransition() to throw.
            //  - invite() can be called (a)synchronously after invite() is called (second call to invite() fails)
            //  - cancel() or terminate()) can be called (a)synchronously after invite() (invite() fails)
            // The caller should avoid the first case, but the second one is common.
            // For now we are just letting the state transition fail in all cases.
            // transition state
            _this.stateTransition(session_state_1.SessionState.Establishing);
            _this.status = Enums_1.SessionStatus.STATUS_INVITE_SENT;
            _this.request.body = { body: body.content, contentType: body.contentType };
            return _this.sendInvite(options);
        })
            .catch(function (error) {
            _this.logger.log(error.message);
            _this.stateTransition(session_state_1.SessionState.Terminated);
            throw error;
        });
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
    Inviter.prototype.sendInvite = function (options) {
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
        if (options === void 0) { options = {}; }
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
        ////
        ////
        // TODO: The Offer/Answer Model Implementation
        //
        // Currently if `earlyMedia` is enabled and the INVITE request forks,
        // the session is terminated if the early dialog does not match the
        // confirmed dialog. This restriction make sense in a WebRTC environment,
        // but there are other enviroments where this restriction does not hold.
        //
        // So while we currently cannot make the offer in INVITE+forking+webrtc
        // case work, we propose doing the following...
        //
        // OPTION 1
        // - add a `earlyMediaForking` option and
        // - require SDH.setDescription() to be callable multiple times.
        //
        // OPTION 2
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
        ////
        // Send the INVITE request.
        this.outgoingInviteRequest = this.userAgent.userAgentCore.invite(this.request, {
            onAccept: function (inviteResponse) {
                // Our transaction layer is "non-standard" in that it will only
                // pass us a 2xx response once per branch, so there is no need to
                // worry about dealing with 2xx retransmissions. However, we can
                // and do still get 2xx responses for multiple branches (when an
                // INVITE is forked) which may create multiple confirmed dialogs.
                // Herein we are acking and sending a bye to any confirmed dialogs
                // which arrive beyond the first one. This is the desired behavior
                // for most applications (but certainly not all).
                // If we already received a confirmed dialog, ack & bye this additional confirmed session.
                if (_this.dialog) {
                    _this.logger.log("Additional confirmed dialog, sending ACK and BYE");
                    _this.ackAndBye(inviteResponse);
                    // We do NOT transition state in this case (this is an "extra" dialog)
                    return;
                }
                // If the user requested cancellation, ack & bye this session.
                if (_this.isCanceled) {
                    _this.logger.log("Canceled session accepted, sending ACK and BYE");
                    _this.ackAndBye(inviteResponse);
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                    return;
                }
                _this.notifyReferer(inviteResponse);
                _this.onAccept(inviteResponse)
                    .then(function () {
                    _this.disposeEarlyMedia();
                })
                    .catch(function (error) {
                    _this.disposeEarlyMedia();
                })
                    .then(function () {
                    if (options.requestDelegate && options.requestDelegate.onAccept) {
                        options.requestDelegate.onAccept(inviteResponse);
                    }
                });
            },
            onProgress: function (inviteResponse) {
                // If the user requested cancellation, ignore response.
                if (_this.isCanceled) {
                    return;
                }
                _this.notifyReferer(inviteResponse);
                _this.onProgress(inviteResponse)
                    .catch(function (error) {
                    _this.disposeEarlyMedia();
                })
                    .then(function () {
                    if (options.requestDelegate && options.requestDelegate.onProgress) {
                        options.requestDelegate.onProgress(inviteResponse);
                    }
                });
            },
            onRedirect: function (inviteResponse) {
                _this.notifyReferer(inviteResponse);
                _this.onRedirect(inviteResponse);
                if (options.requestDelegate && options.requestDelegate.onRedirect) {
                    options.requestDelegate.onRedirect(inviteResponse);
                }
            },
            onReject: function (inviteResponse) {
                _this.notifyReferer(inviteResponse);
                _this.onReject(inviteResponse);
                if (options.requestDelegate && options.requestDelegate.onReject) {
                    options.requestDelegate.onReject(inviteResponse);
                }
            },
            onTrying: function (inviteResponse) {
                _this.notifyReferer(inviteResponse);
                _this.onTrying(inviteResponse);
                if (options.requestDelegate && options.requestDelegate.onTrying) {
                    options.requestDelegate.onTrying(inviteResponse);
                }
            }
        });
        return this.outgoingInviteRequest;
    };
    Inviter.prototype.disposeEarlyMedia = function () {
        this.earlyMediaSessionDescriptionHandlers.forEach(function (sessionDescriptionHandler) {
            sessionDescriptionHandler.close();
        });
        this.earlyMediaSessionDescriptionHandlers.clear();
    };
    Inviter.prototype.notifyReferer = function (response) {
        var _this = this;
        if (!this.referred) {
            return;
        }
        if (!(this.referred instanceof session_1.Session)) {
            throw new Error("Referred session not instance of session");
        }
        if (!this.referred.dialog) {
            return;
        }
        if (!response.message.statusCode) {
            throw new Error("Status code undefined.");
        }
        if (!response.message.reasonPhrase) {
            throw new Error("Reason phrase undefined.");
        }
        var statusCode = response.message.statusCode;
        var reasonPhrase = response.message.reasonPhrase;
        var body = ("SIP/2.0 " + statusCode + " " + reasonPhrase).trim();
        var outgoingNotifyRequest = this.referred.dialog.notify(undefined, {
            extraHeaders: [
                "Event: refer",
                "Subscription-State: terminated",
            ],
            body: {
                contentDisposition: "render",
                contentType: "message/sipfrag",
                content: body
            }
        });
        // The implicit subscription created by a REFER is the same as a
        // subscription created with a SUBSCRIBE request.  The agent issuing the
        // REFER can terminate this subscription prematurely by unsubscribing
        // using the mechanisms described in [2].  Terminating a subscription,
        // either by explicitly unsubscribing or rejecting NOTIFY, is not an
        // indication that the referenced request should be withdrawn or
        // abandoned.
        // https://tools.ietf.org/html/rfc3515#section-2.4.4
        // FIXME: TODO: This should be done in a subscribe dialog to satisfy the above.
        // If the notify is rejected, stop sending NOTIFY requests.
        outgoingNotifyRequest.delegate = {
            onReject: function () {
                _this.referred = undefined;
            }
        };
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 2xx response.
     */
    Inviter.prototype.onAccept = function (inviteResponse) {
        var _this = this;
        this.logger.log("Inviter.onAccept");
        // validate state
        if (this.state !== session_state_1.SessionState.Establishing) {
            this.logger.error("Accept received while in state " + this.state + ", dropping response");
            return Promise.reject(new Error("Invalid session state " + this.state));
        }
        var response = inviteResponse.message;
        var session = inviteResponse.session;
        // Ported behavior.
        if (response.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
        }
        // We have a confirmed dialog.
        this.dialog = session;
        this.dialog.delegate = {
            onAck: function (ackRequest) { return _this.onAckRequest(ackRequest); },
            onBye: function (byeRequest) { return _this.onByeRequest(byeRequest); },
            onInfo: function (infoRequest) { return _this.onInfoRequest(infoRequest); },
            onInvite: function (inviteRequest) { return _this.onInviteRequest(inviteRequest); },
            onNotify: function (notifyRequest) { return _this.onNotifyRequest(notifyRequest); },
            onPrack: function (prackRequest) { return _this.onPrackRequest(prackRequest); },
            onRefer: function (referRequest) { return _this.onReferRequest(referRequest); }
        };
        var sdhOptions = this.sessionDescriptionHandlerOptions;
        var sdhModifiers = this.sessionDescriptionHandlerModifiers;
        switch (session.signalingState) {
            case core_1.SignalingState.Initial:
                // INVITE without offer, so MUST have offer at this point, so invalid state.
                this.logger.error("Received 2xx response to INVITE without a session description");
                this.ackAndBye(inviteResponse, 400, "Missing session description");
                this.stateTransition(session_state_1.SessionState.Terminated);
                return Promise.reject(new Error(Constants_1.C.causes.BAD_MEDIA_DESCRIPTION));
            case core_1.SignalingState.HaveLocalOffer:
                // INVITE with offer, so MUST have answer at this point, so invalid state.
                this.logger.error("Received 2xx response to INVITE without a session description");
                this.ackAndBye(inviteResponse, 400, "Missing session description");
                this.stateTransition(session_state_1.SessionState.Terminated);
                return Promise.reject(new Error(Constants_1.C.causes.BAD_MEDIA_DESCRIPTION));
            case core_1.SignalingState.HaveRemoteOffer: {
                // INVITE without offer, received offer in 2xx, so MUST send answer in ACK.
                if (!this.dialog.offer) {
                    throw new Error("Session offer undefined in signaling state " + this.dialog.signalingState + ".");
                }
                var options = {
                    sessionDescriptionHandlerOptions: sdhOptions,
                    sessionDescriptionHandlerModifiers: sdhModifiers
                };
                return this.setOfferAndGetAnswer(this.dialog.offer, options)
                    .then(function (body) {
                    _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var ackRequest = inviteResponse.ack({ body: body });
                    _this.stateTransition(session_state_1.SessionState.Established);
                })
                    .catch(function (error) {
                    _this.ackAndBye(inviteResponse, 488, "Invalid session description");
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                    throw error;
                });
            }
            case core_1.SignalingState.Stable: {
                // If INVITE without offer and we have already completed the initial exchange.
                if (this.earlyMediaSessionDescriptionHandlers.size > 0) {
                    var sdh = this.earlyMediaSessionDescriptionHandlers.get(session.id);
                    if (!sdh) {
                        throw new Error("Session description handler undefined.");
                    }
                    this.setSessionDescriptionHandler(sdh);
                    this.earlyMediaSessionDescriptionHandlers.delete(session.id);
                    this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var ackRequest = inviteResponse.ack();
                    this.stateTransition(session_state_1.SessionState.Established);
                    return Promise.resolve();
                }
                // If INVITE with offer and we used an "early" answer in a provisional response for media
                if (this.earlyMediaDialog) {
                    // If early media dialog doesn't match confirmed dialog, we must unfortunately fail.
                    // This limitation stems from how WebRTC currently implements its offer/answer model.
                    // There are details elsewhere, but in short a WebRTC offer cannot be forked.
                    if (this.earlyMediaDialog !== session) {
                        if (this.earlyMedia) {
                            var message = "You have set the 'earlyMedia' option to 'true' which requires that your INVITE requests " +
                                "do not fork and yet this INVITE request did in fact fork. Consequentially and not surprisingly " +
                                "the end point which accepted the INVITE (confirmed dialog) does not match the end point with " +
                                "which early media has been setup (early dialog) and thus this session is unable to proceed. " +
                                "In accordance with the SIP specifications, the SIP servers your end point is connected to " +
                                "determine if an INVITE forks and the forking behaviour of those servers cannot be controlled " +
                                "by this library. If you wish to use early media with this library you must configure those " +
                                "servers accordingly. Alternatively you may set the 'earlyMedia' to 'false' which will allow " +
                                "this library to function with any INVITE requests which do fork.";
                            this.logger.error(message);
                        }
                        var error = new Error("Early media dialog does not equal confirmed dialog, terminating session");
                        this.logger.error(error.message);
                        this.ackAndBye(inviteResponse, 488, "Not Acceptable Here");
                        this.stateTransition(session_state_1.SessionState.Terminated);
                        return Promise.reject(error);
                    }
                    // Otherwise we are good to go.
                    this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var ackRequest = inviteResponse.ack();
                    this.stateTransition(session_state_1.SessionState.Established);
                    return Promise.resolve();
                }
                // If INVITE with offer and we have been waiting till now to apply the answer.
                var answer = session.answer;
                if (!answer) {
                    throw new Error("Answer is undefined.");
                }
                var options = {
                    sessionDescriptionHandlerOptions: sdhOptions,
                    sessionDescriptionHandlerModifiers: sdhModifiers
                };
                return this.setAnswer(answer, options)
                    .then(function () {
                    // This session has completed an initial offer/answer exchange...
                    var ackOptions;
                    if (_this.renderbody && _this.rendertype) {
                        ackOptions = {
                            body: { contentDisposition: "render", contentType: _this.rendertype, content: _this.renderbody }
                        };
                    }
                    _this.status = Enums_1.SessionStatus.STATUS_CONFIRMED;
                    var ackRequest = inviteResponse.ack(ackOptions);
                    _this.stateTransition(session_state_1.SessionState.Established);
                })
                    .catch(function (error) {
                    _this.logger.error(error.message);
                    _this.ackAndBye(inviteResponse, 488, "Not Acceptable Here");
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                    throw error;
                });
            }
            case core_1.SignalingState.Closed:
                // Dialog has terminated.
                return Promise.reject(new Error("Terminated."));
            default:
                throw new Error("Unknown session signaling state.");
        }
    };
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse - 1xx response.
     */
    Inviter.prototype.onProgress = function (inviteResponse) {
        var _this = this;
        this.logger.log("Inviter.onProgress");
        // validate state
        if (this.state !== session_state_1.SessionState.Establishing) {
            this.logger.error("Progress received while in state " + this.state + ", dropping response");
            return Promise.reject(new Error("Invalid session state " + this.state));
        }
        if (!this.outgoingInviteRequest) {
            throw new Error("Outgoing INVITE request undefined.");
        }
        var response = inviteResponse.message;
        var session = inviteResponse.session;
        // Ported - Set status.
        this.status = Enums_1.SessionStatus.STATUS_1XX_RECEIVED;
        // Ported - Set assertedIdentity.
        if (response.hasHeader("P-Asserted-Identity")) {
            this.assertedIdentity = core_1.Grammar.nameAddrHeaderParse(response.getHeader("P-Asserted-Identity"));
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
        var sdhOptions = this.sessionDescriptionHandlerOptions;
        var sdhModifiers = this.sessionDescriptionHandlerModifiers;
        switch (session.signalingState) {
            case core_1.SignalingState.Initial:
                // INVITE without offer and session still has no offer (and no answer).
                if (responseReliable) {
                    // Similarly, if a reliable provisional
                    // response is the first reliable message sent back to the UAC, and the
                    // INVITE did not contain an offer, one MUST appear in that reliable
                    // provisional response.
                    // https://tools.ietf.org/html/rfc3262#section-5
                    this.logger.warn("First reliable provisional response received MUST contain an offer when INVITE does not contain an offer.");
                    // FIXME: Known popular UA's currently end up here...
                    inviteResponse.prack({ extraHeaders: extraHeaders });
                }
                return Promise.resolve();
            case core_1.SignalingState.HaveLocalOffer:
                // INVITE with offer and session only has that initial local offer.
                if (responseReliable) {
                    inviteResponse.prack({ extraHeaders: extraHeaders });
                }
                return Promise.resolve();
            case core_1.SignalingState.HaveRemoteOffer:
                if (!responseReliable) {
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
                    this.logger.warn("Non-reliable provisional response MUST NOT contain an initial offer, discarding response.");
                    return Promise.resolve();
                }
                // If the initial offer is in the first reliable non-failure
                // message from the UAS back to UAC, the answer MUST be in the
                // acknowledgement for that message
                var sdh_1 = this.sessionDescriptionHandlerFactory(this, this.userAgent.configuration.sessionDescriptionHandlerFactoryOptions || {});
                this.emit("SessionDescriptionHandler-created", sdh_1);
                this.earlyMediaSessionDescriptionHandlers.set(session.id, sdh_1);
                return sdh_1
                    .setDescription(response.body, sdhOptions, sdhModifiers)
                    .then(function () { return sdh_1.getDescription(sdhOptions, sdhModifiers); })
                    .then(function (description) {
                    var body = {
                        contentDisposition: "session", contentType: description.contentType, content: description.body
                    };
                    inviteResponse.prack({ extraHeaders: extraHeaders, body: body });
                })
                    .catch(function (error) {
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        throw error;
                    }
                    _this.stateTransition(session_state_1.SessionState.Terminated);
                    throw error;
                });
            case core_1.SignalingState.Stable:
                // This session has completed an initial offer/answer exchange, so...
                // - INVITE with SDP and this provisional response MAY be reliable
                // - INVITE without SDP and this provisional response MAY be reliable
                if (responseReliable) {
                    inviteResponse.prack({ extraHeaders: extraHeaders });
                }
                if (this.earlyMedia && !this.earlyMediaDialog) {
                    this.earlyMediaDialog = session;
                    var answer = session.answer;
                    if (!answer) {
                        throw new Error("Answer is undefined.");
                    }
                    var options = {
                        sessionDescriptionHandlerOptions: sdhOptions,
                        sessionDescriptionHandlerModifiers: sdhModifiers
                    };
                    return this.setAnswer(answer, options)
                        .catch(function (error) {
                        if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                            throw error;
                        }
                        _this.stateTransition(session_state_1.SessionState.Terminated);
                        throw error;
                    });
                }
                return Promise.resolve();
            case core_1.SignalingState.Closed:
                // Dialog has terminated.
                return Promise.reject(new Error("Terminated."));
            default:
                throw new Error("Unknown session signaling state.");
        }
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 3xx response.
     */
    Inviter.prototype.onRedirect = function (inviteResponse) {
        this.logger.log("Inviter.onRedirect");
        // validate state
        if (this.state !== session_state_1.SessionState.Establishing &&
            this.state !== session_state_1.SessionState.Terminating) {
            this.logger.error("Redirect received while in state " + this.state + ", dropping response");
            return;
        }
        // transition state
        this.stateTransition(session_state_1.SessionState.Terminated);
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 4xx, 5xx, or 6xx response.
     */
    Inviter.prototype.onReject = function (inviteResponse) {
        this.logger.log("Inviter.onReject");
        // validate state
        if (this.state !== session_state_1.SessionState.Establishing &&
            this.state !== session_state_1.SessionState.Terminating) {
            this.logger.error("Reject received while in state " + this.state + ", dropping response");
            return;
        }
        // transition state
        this.stateTransition(session_state_1.SessionState.Terminated);
    };
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 100 response.
     */
    Inviter.prototype.onTrying = function (inviteResponse) {
        this.logger.log("Inviter.onTrying");
        // validate state
        if (this.state !== session_state_1.SessionState.Establishing) {
            this.logger.error("Trying received while in state " + this.state + ", dropping response");
            return;
        }
    };
    return Inviter;
}(session_1.Session));
exports.Inviter = Inviter;
