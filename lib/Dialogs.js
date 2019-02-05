"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var RequestSender_1 = require("./RequestSender");
var SIPMessage_1 = require("./SIPMessage");
/*
 * @augments SIP
 * @class Class creating a SIP dialog. RFC 3261 12.1
 * @param {SIP.RTCSession} owner
 * @param {SIP.IncomingRequest|SIP.IncomingResponse} message
 * @param {Enum} type UAC / UAS
 * @param {Enum} state SIP.Dialog.C.STATUS_EARLY / SIP.Dialog.C.STATUS_CONFIRMED
 */
var Dialog = /** @class */ (function () {
    function Dialog(owner, message, type, state) {
        this.pracked = [];
        this.uacPendingReply = false;
        this.uasPendingReply = false;
        this.type = Enums_1.TypeStrings.Dialog;
        if (!message.hasHeader("contact")) {
            throw new Error("unable to create a Dialog without Contact header field");
        }
        if (message.type === Enums_1.TypeStrings.IncomingResponse) {
            var statusCode = message.statusCode;
            state = (statusCode && statusCode < 200) ?
                Enums_1.DialogStatus.STATUS_EARLY : Enums_1.DialogStatus.STATUS_CONFIRMED;
        }
        else {
            // Create confirmed dialog if state is not defined
            state = state || Enums_1.DialogStatus.STATUS_CONFIRMED;
        }
        var contact = message.parseHeader("contact");
        // RFC 3261 12.1.1
        if (type === "UAS" && message.type === Enums_1.TypeStrings.IncomingRequest) {
            this.id = {
                callId: message.callId,
                localTag: message.toTag,
                remoteTag: message.fromTag,
                toString: function () {
                    return message.callId + message.toTag + message.fromTag;
                }
            };
            this.state = state;
            this.remoteSeqnum = message.cseq;
            this.localUri = (message.parseHeader("to") || {}).uri;
            this.remoteUri = (message.parseHeader("from") || {}).uri;
            this.remoteTarget = contact.uri;
            this.routeSet = message.getHeaders("record-route");
            this.inviteSeqnum = message.cseq;
            this.localSeqnum = message.cseq;
        }
        else { // type is UAC, RFC 3261 12.1.2
            this.id = {
                callId: message.callId,
                localTag: message.fromTag,
                remoteTag: message.toTag,
                toString: function () {
                    return message.callId + message.fromTag + message.toTag;
                }
            };
            this.state = state;
            this.inviteSeqnum = message.cseq;
            this.localSeqnum = message.cseq;
            this.localUri = message.parseHeader("from").uri;
            this.pracked = [];
            this.remoteUri = message.parseHeader("to").uri;
            this.remoteTarget = contact.uri;
            this.routeSet = message.getHeaders("record-route").reverse();
        }
        this.logger = owner.ua.getLogger("sip.dialog", this.id.toString());
        this.owner = owner;
        owner.ua.dialogs[this.id.toString()] = this;
        this.logger.log("new " + type + " dialog created with status " +
            (this.state === Enums_1.DialogStatus.STATUS_EARLY ? "EARLY" : "CONFIRMED"));
        owner.emit("dialog", this);
    }
    /**
     * @param {SIP.IncomingMessage} message
     * @param {Enum} UAC/UAS
     */
    Dialog.prototype.update = function (message, type) {
        this.state = Enums_1.DialogStatus.STATUS_CONFIRMED;
        this.logger.log("dialog " + this.id.toString() + "  changed to CONFIRMED state");
        if (type === "UAC") {
            // RFC 3261 13.2.2.4
            this.routeSet = message.getHeaders("record-route").reverse();
        }
    };
    Dialog.prototype.terminate = function () {
        this.logger.log("dialog " + this.id.toString() + " deleted");
        if (this.sessionDescriptionHandler && this.state !== Enums_1.DialogStatus.STATUS_CONFIRMED) {
            // TODO: This should call .close() on the handler when implemented
            this.sessionDescriptionHandler.close();
        }
        delete this.owner.ua.dialogs[this.id.toString()];
    };
    /**
     * @param {String} method request method
     * @param {Object} extraHeaders extra headers
     * @returns {SIP.OutgoingRequest}
     */
    // RFC 3261 12.2.1.1
    Dialog.prototype.createRequest = function (method, extraHeaders, body) {
        if (extraHeaders === void 0) { extraHeaders = []; }
        extraHeaders = extraHeaders.slice();
        if (!this.localSeqnum) {
            this.localSeqnum = Math.floor(Math.random() * 10000);
        }
        var cseq = (method === Constants_1.C.CANCEL || method === Constants_1.C.ACK) ? this.inviteSeqnum : this.localSeqnum += 1;
        var request = new SIPMessage_1.OutgoingRequest(method, this.remoteTarget, this.owner.ua, {
            cseq: cseq,
            callId: this.id.callId,
            fromUri: this.localUri,
            fromTag: this.id.localTag,
            toIri: this.remoteUri,
            toTag: this.id.remoteTag,
            routeSet: this.routeSet
        }, extraHeaders, body);
        request.dialog = this;
        return request;
    };
    /**
     * @param {SIP.IncomingRequest} request
     * @returns {Boolean}
     */
    // RFC 3261 12.2.2
    Dialog.prototype.checkInDialogRequest = function (request) {
        var _this = this;
        if (!this.remoteSeqnum) {
            this.remoteSeqnum = request.cseq;
        }
        else if (request.cseq < this.remoteSeqnum) {
            // Do not try to reply to an ACK request.
            if (request.method !== Constants_1.C.ACK) {
                request.reply(500);
            }
            return request.cseq === this.inviteSeqnum;
        }
        switch (request.method) {
            // RFC3261 14.2 Modifying an Existing Session -UAS BEHAVIOR-
            case Constants_1.C.INVITE:
                if (this.uacPendingReply === true) {
                    request.reply(491);
                }
                else if (this.uasPendingReply === true && request.cseq > this.remoteSeqnum) {
                    var retryAfter = Math.floor((Math.random() * 10)) + 1;
                    request.reply(500, undefined, ["Retry-After:" + retryAfter]);
                    this.remoteSeqnum = request.cseq;
                    return false;
                }
                else {
                    this.uasPendingReply = true;
                    var stateChanged_1 = function () {
                        if (request.serverTransaction &&
                            (request.serverTransaction.state === Enums_1.TransactionStatus.STATUS_ACCEPTED ||
                                request.serverTransaction.state === Enums_1.TransactionStatus.STATUS_COMPLETED ||
                                request.serverTransaction.state === Enums_1.TransactionStatus.STATUS_TERMINATED)) {
                            request.serverTransaction.removeListener("stateChanged", stateChanged_1);
                            _this.uasPendingReply = false;
                        }
                    };
                    if (request.serverTransaction) {
                        request.serverTransaction.on("stateChanged", stateChanged_1.bind(this));
                    }
                }
                // RFC3261 12.2.2 Replace the dialog`s remote target URI if the request is accepted
                if (request.hasHeader("contact") && request.serverTransaction) {
                    request.serverTransaction.on("stateChanged", function () {
                        if (request.serverTransaction && request.serverTransaction.state === Enums_1.TransactionStatus.STATUS_ACCEPTED) {
                            _this.remoteTarget = request.parseHeader("contact").uri;
                        }
                    });
                }
                break;
            case Constants_1.C.NOTIFY:
                // RFC6665 3.2 Replace the dialog`s remote target URI if the request is accepted
                if (request.hasHeader("contact") && request.serverTransaction) {
                    request.serverTransaction.on("stateChanged", function () {
                        if (request.serverTransaction && request.serverTransaction.state === Enums_1.TransactionStatus.STATUS_COMPLETED) {
                            _this.remoteTarget = request.parseHeader("contact").uri;
                        }
                    });
                }
                break;
        }
        if (request.cseq > this.remoteSeqnum) {
            this.remoteSeqnum = request.cseq;
        }
        return true;
    };
    Dialog.prototype.sendRequest = function (applicant, method, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var extraHeaders = (options.extraHeaders || []).slice();
        var body;
        if (options.body) {
            if (options.body.body) {
                body = options.body;
            }
            else {
                body = {};
                body.body = options.body;
                if (options.contentType) {
                    body.contentType = options.contentType;
                }
            }
        }
        var request = this.createRequest(method, extraHeaders, body);
        var dialogSend = function (reattempt) {
            var requestSender = new RequestSender_1.RequestSender({
                request: request,
                onRequestTimeout: applicant.onRequestTimeout,
                onTransportError: applicant.onTransportError,
                receiveResponse: function (response) {
                    // RFC3261 12.2.1.2 408 or 481 is received for a request within a dialog.
                    if (response.statusCode === 408 || response.statusCode === 481) {
                        applicant.onDialogError(response);
                    }
                    else if (response.method === Constants_1.C.INVITE && response.statusCode === 491) {
                        if (reattempt) {
                            applicant.receiveResponse(response);
                        }
                        else {
                            request.cseq = _this.localSeqnum += 1;
                            setTimeout(function () {
                                // first check is to determine !Subscription (remove circular dependency)
                                if (_this.owner.status !== undefined &&
                                    _this.owner.status
                                        !== Enums_1.SessionStatus.STATUS_TERMINATED) {
                                    // RFC3261 14.1 Modifying an Existing Session. UAC Behavior.
                                    dialogSend(true);
                                }
                            }, 1000);
                        }
                    }
                    else {
                        applicant.receiveResponse(response);
                    }
                }
            }, _this.owner.ua);
            requestSender.send();
            // RFC3261 14.2 Modifying an Existing Session -UAC BEHAVIOR-
            if (!requestSender.clientTransaction ||
                requestSender.clientTransaction.type === Enums_1.TypeStrings.AckClientTransaction) {
                return;
            }
            else if (request.method === Constants_1.C.INVITE &&
                requestSender.clientTransaction &&
                requestSender.clientTransaction.state
                    !== Enums_1.TransactionStatus.STATUS_TERMINATED) {
                _this.uacPendingReply = true;
                var stateChanged_2 = function () {
                    var state = requestSender.clientTransaction.state;
                    if (!requestSender.clientTransaction ||
                        requestSender.clientTransaction.type === Enums_1.TypeStrings.AckClientTransaction) {
                        return;
                    }
                    else if (requestSender.clientTransaction &&
                        (state === Enums_1.TransactionStatus.STATUS_ACCEPTED ||
                            state === Enums_1.TransactionStatus.STATUS_COMPLETED ||
                            state === Enums_1.TransactionStatus.STATUS_TERMINATED)) {
                        requestSender.clientTransaction.removeListener("stateChanged", stateChanged_2);
                        _this.uacPendingReply = false;
                    }
                };
                requestSender.clientTransaction.on("stateChanged", stateChanged_2.bind(_this));
            }
        };
        dialogSend(false);
        return request;
    };
    /**
     * @param {SIP.IncomingRequest} request
     */
    Dialog.prototype.receiveRequest = function (request) {
        // Check in-dialog request
        if (!this.checkInDialogRequest(request)) {
            return;
        }
        this.owner.receiveRequest(request);
    };
    Dialog.C = Enums_1.DialogStatus;
    return Dialog;
}());
exports.Dialog = Dialog;
