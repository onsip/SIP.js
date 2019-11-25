"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var core_1 = require("./core");
var Enums_1 = require("./Enums");
var Exceptions_1 = require("./Exceptions");
var ServerContext_1 = require("./ServerContext");
// tslint:disable-next-line:max-classes-per-file
var ReferClientContext = /** @class */ (function (_super) {
    tslib_1.__extends(ReferClientContext, _super);
    function ReferClientContext(ua, applicant, target, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        if (ua === undefined || applicant === undefined || target === undefined) {
            throw new TypeError("Not enough arguments");
        }
        _this = _super.call(this, ua, Constants_1.C.REFER, applicant.remoteIdentity.uri.toString(), options) || this;
        _this.type = Enums_1.TypeStrings.ReferClientContext;
        _this.options = options;
        _this.extraHeaders = (_this.options.extraHeaders || []).slice();
        _this.applicant = applicant;
        _this.target = _this.initReferTo(target);
        if (_this.ua) {
            _this.extraHeaders.push("Referred-By: <" + _this.ua.configuration.uri + ">");
        }
        // TODO: Check that this is correct isc/icc
        _this.extraHeaders.push("Contact: " + applicant.contact);
        // this is UA.C.ALLOWED_METHODS, removed to get around circular dependency
        _this.extraHeaders.push("Allow: " + [
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
        _this.extraHeaders.push("Refer-To: " + _this.target);
        _this.errorListener = _this.onTransportError.bind(_this);
        if (ua.transport) {
            ua.transport.on("transportError", _this.errorListener);
        }
        return _this;
    }
    ReferClientContext.prototype.refer = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var extraHeaders = (this.extraHeaders || []).slice();
        if (options.extraHeaders) {
            extraHeaders.concat(options.extraHeaders);
        }
        this.applicant.sendRequest(Constants_1.C.REFER, {
            extraHeaders: this.extraHeaders,
            receiveResponse: function (response) {
                var statusCode = response && response.statusCode ? response.statusCode.toString() : "";
                if (/^1[0-9]{2}$/.test(statusCode)) {
                    _this.emit("referRequestProgress", _this);
                }
                else if (/^2[0-9]{2}$/.test(statusCode)) {
                    _this.emit("referRequestAccepted", _this);
                }
                else if (/^[4-6][0-9]{2}$/.test(statusCode)) {
                    _this.emit("referRequestRejected", _this);
                }
                if (options.receiveResponse) {
                    options.receiveResponse(response);
                }
            }
        });
        return this;
    };
    ReferClientContext.prototype.receiveNotify = function (request) {
        // If we can correctly handle this, then we need to send a 200 OK!
        var contentType = request.message.hasHeader("Content-Type") ?
            request.message.getHeader("Content-Type") : undefined;
        if (contentType && contentType.search(/^message\/sipfrag/) !== -1) {
            var messageBody = core_1.Grammar.parse(request.message.body, "sipfrag");
            if (messageBody === -1) {
                request.reject({
                    statusCode: 489,
                    reasonPhrase: "Bad Event"
                });
                return;
            }
            switch (true) {
                case (/^1[0-9]{2}$/.test(messageBody.status_code)):
                    this.emit("referProgress", this);
                    break;
                case (/^2[0-9]{2}$/.test(messageBody.status_code)):
                    this.emit("referAccepted", this);
                    if (!this.options.activeAfterTransfer && this.applicant.terminate) {
                        this.applicant.terminate();
                    }
                    break;
                default:
                    this.emit("referRejected", this);
                    break;
            }
            request.accept();
            this.emit("notify", request.message);
            return;
        }
        request.reject({
            statusCode: 489,
            reasonPhrase: "Bad Event"
        });
    };
    ReferClientContext.prototype.initReferTo = function (target) {
        var stringOrURI;
        if (typeof target === "string") {
            // REFER without Replaces (Blind Transfer)
            var targetString = core_1.Grammar.parse(target, "Refer_To");
            stringOrURI = targetString && targetString.uri ? targetString.uri : target;
            // Check target validity
            var targetUri = this.ua.normalizeTarget(target);
            if (!targetUri) {
                throw new TypeError("Invalid target: " + target);
            }
            stringOrURI = targetUri;
        }
        else {
            // REFER with Replaces (Attended Transfer)
            if (!target.session) {
                throw new Error("Session undefined.");
            }
            var displayName = target.remoteIdentity.friendlyName;
            var remoteTarget = target.session.remoteTarget.toString();
            var callId = target.session.callId;
            var remoteTag = target.session.remoteTag;
            var localTag = target.session.localTag;
            var replaces = encodeURIComponent(callId + ";to-tag=" + remoteTag + ";from-tag=" + localTag);
            stringOrURI = "\"" + displayName + "\" <" + remoteTarget + "?Replaces=" + replaces + ">";
        }
        return stringOrURI;
    };
    return ReferClientContext;
}(ClientContext_1.ClientContext));
exports.ReferClientContext = ReferClientContext;
// tslint:disable-next-line:max-classes-per-file
var ReferServerContext = /** @class */ (function (_super) {
    tslib_1.__extends(ReferServerContext, _super);
    function ReferServerContext(ua, incomingRequest, session) {
        var _this = _super.call(this, ua, incomingRequest) || this;
        _this.session = session;
        _this.type = Enums_1.TypeStrings.ReferServerContext;
        _this.ua = ua;
        _this.status = Enums_1.SessionStatus.STATUS_INVITE_RECEIVED;
        _this.fromTag = _this.request.fromTag;
        _this.id = _this.request.callId + _this.fromTag;
        _this.contact = _this.ua.contact.toString();
        _this.logger = ua.getLogger("sip.referservercontext", _this.id);
        // Needed to send the NOTIFY's
        _this.cseq = Math.floor(Math.random() * 10000);
        _this.callId = _this.request.callId;
        _this.fromUri = _this.request.to.uri;
        _this.fromTag = _this.request.to.parameters.tag;
        _this.remoteTarget = _this.request.headers.Contact[0].parsed.uri;
        _this.toUri = _this.request.from.uri;
        _this.toTag = _this.request.fromTag;
        _this.routeSet = _this.request.getHeaders("record-route");
        // RFC 3515 2.4.1
        if (!_this.request.hasHeader("refer-to")) {
            _this.logger.warn("Invalid REFER packet. A refer-to header is required. Rejecting refer.");
            _this.reject();
            return _this;
        }
        _this.referTo = _this.request.parseHeader("refer-to");
        // TODO: Must set expiration timer and send 202 if there is no response by then
        _this.referredSession = _this.ua.findSession(_this.request);
        if (_this.request.hasHeader("referred-by")) {
            _this.referredBy = _this.request.getHeader("referred-by");
        }
        if (_this.referTo.uri.hasHeader("replaces")) {
            _this.replaces = _this.referTo.uri.getHeader("replaces");
        }
        _this.errorListener = _this.onTransportError.bind(_this);
        if (ua.transport) {
            ua.transport.on("transportError", _this.errorListener);
        }
        _this.status = Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER;
        return _this;
    }
    ReferServerContext.prototype.progress = function () {
        if (this.status !== Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.incomingRequest.trying();
    };
    ReferServerContext.prototype.reject = function (options) {
        if (options === void 0) { options = {}; }
        if (this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.logger.log("Rejecting refer");
        this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
        _super.prototype.reject.call(this, options);
        this.emit("referRequestRejected", this);
    };
    ReferServerContext.prototype.accept = function (options, modifiers) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.status === Enums_1.SessionStatus.STATUS_WAITING_FOR_ANSWER) {
            this.status = Enums_1.SessionStatus.STATUS_ANSWERED;
        }
        else {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        this.incomingRequest.accept({
            statusCode: 202,
            reasonPhrase: "Accepted"
        });
        this.emit("referRequestAccepted", this);
        if (options.followRefer) {
            this.logger.log("Accepted refer, attempting to automatically follow it");
            var target = this.referTo.uri;
            if (!target.scheme || !target.scheme.match("^sips?$")) {
                this.logger.error("SIP.js can only automatically follow SIP refer target");
                this.reject();
                return;
            }
            var inviteOptions = options.inviteOptions || {};
            var extraHeaders = (inviteOptions.extraHeaders || []).slice();
            if (this.replaces) {
                // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
                extraHeaders.push("Replaces: " + decodeURIComponent(this.replaces));
            }
            if (this.referredBy) {
                extraHeaders.push("Referred-By: " + this.referredBy);
            }
            inviteOptions.extraHeaders = extraHeaders;
            target.clearHeaders();
            this.targetSession = this.ua.invite(target.toString(), inviteOptions, modifiers);
            this.emit("referInviteSent", this);
            if (this.targetSession) {
                this.targetSession.once("progress", function (response) {
                    var statusCode = response.statusCode || 100;
                    var reasonPhrase = response.reasonPhrase;
                    _this.sendNotify(("SIP/2.0 " + statusCode + " " + reasonPhrase).trim());
                    _this.emit("referProgress", _this);
                    if (_this.referredSession) {
                        _this.referredSession.emit("referProgress", _this);
                    }
                });
                this.targetSession.once("accepted", function () {
                    _this.logger.log("Successfully followed the refer");
                    _this.sendNotify("SIP/2.0 200 OK");
                    _this.emit("referAccepted", _this);
                    if (_this.referredSession) {
                        _this.referredSession.emit("referAccepted", _this);
                    }
                });
                var referFailed = function (response) {
                    if (_this.status === Enums_1.SessionStatus.STATUS_TERMINATED) {
                        return; // No throw here because it is possible this gets called multiple times
                    }
                    _this.logger.log("Refer was not successful. Resuming session");
                    if (response && response.statusCode === 429) {
                        _this.logger.log("Alerting referrer that identity is required.");
                        _this.sendNotify("SIP/2.0 429 Provide Referrer Identity");
                        return;
                    }
                    _this.sendNotify("SIP/2.0 603 Declined");
                    // Must change the status after sending the final Notify or it will not send due to check
                    _this.status = Enums_1.SessionStatus.STATUS_TERMINATED;
                    _this.emit("referRejected", _this);
                    if (_this.referredSession) {
                        _this.referredSession.emit("referRejected");
                    }
                };
                this.targetSession.once("rejected", referFailed);
                this.targetSession.once("failed", referFailed);
            }
        }
        else {
            this.logger.log("Accepted refer, but did not automatically follow it");
            this.sendNotify("SIP/2.0 200 OK");
            this.emit("referAccepted", this);
            if (this.referredSession) {
                this.referredSession.emit("referAccepted", this);
            }
        }
    };
    ReferServerContext.prototype.sendNotify = function (bodyStr) {
        // FIXME: Ported this. Clean it up. Session knows its state.
        if (this.status !== Enums_1.SessionStatus.STATUS_ANSWERED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        if (core_1.Grammar.parse(bodyStr, "sipfrag") === -1) {
            throw new Error("sipfrag body is required to send notify for refer");
        }
        var body = {
            contentDisposition: "render",
            contentType: "message/sipfrag",
            content: bodyStr
        };
        // NOTIFY requests sent in same dialog as in dialog REFER.
        if (this.session) {
            this.session.notify(undefined, {
                extraHeaders: [
                    "Event: refer",
                    "Subscription-State: terminated",
                ],
                body: body
            });
            return;
        }
        // The implicit subscription created by a REFER is the same as a
        // subscription created with a SUBSCRIBE request.  The agent issuing the
        // REFER can terminate this subscription prematurely by unsubscribing
        // using the mechanisms described in [2].  Terminating a subscription,
        // either by explicitly unsubscribing or rejecting NOTIFY, is not an
        // indication that the referenced request should be withdrawn or
        // abandoned.
        // https://tools.ietf.org/html/rfc3515#section-2.4.4
        // NOTIFY requests sent in new dialog for out of dialog REFER.
        // FIXME: TODO: This should be done in a subscribe dialog to satisfy the above.
        var request = this.ua.userAgentCore.makeOutgoingRequestMessage(Constants_1.C.NOTIFY, this.remoteTarget, this.fromUri, this.toUri, {
            cseq: this.cseq += 1,
            callId: this.callId,
            fromTag: this.fromTag,
            toTag: this.toTag,
            routeSet: this.routeSet
        }, [
            "Event: refer",
            "Subscription-State: terminated",
            "Content-Type: message/sipfrag"
        ], body);
        var transport = this.ua.transport;
        if (!transport) {
            throw new Error("Transport undefined.");
        }
        var user = {
            loggerFactory: this.ua.getLoggerFactory()
        };
        var nic = new core_1.NonInviteClientTransaction(request, transport, user);
    };
    ReferServerContext.prototype.on = function (name, callback) { return _super.prototype.on.call(this, name, callback); };
    return ReferServerContext;
}(ServerContext_1.ServerContext));
exports.ReferServerContext = ReferServerContext;
