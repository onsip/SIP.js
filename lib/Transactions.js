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
var events_1 = require("events");
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var SIPMessage_1 = require("./SIPMessage");
var Timers_1 = require("./Timers");
// SIP Transactions module.
var C = {
    // Transaction states
    STATUS_TRYING: 1,
    STATUS_PROCEEDING: 2,
    STATUS_CALLING: 3,
    STATUS_ACCEPTED: 4,
    STATUS_COMPLETED: 5,
    STATUS_TERMINATED: 6,
    STATUS_CONFIRMED: 7,
    // Transaction types
    NON_INVITE_CLIENT: "nict",
    NON_INVITE_SERVER: "nist",
    INVITE_CLIENT: "ict",
    INVITE_SERVER: "ist"
};
var buildViaHeader = function (ua, transport, id) {
    var via = "SIP/2.0/" + (ua.configuration.hackViaTcp ? "TCP" : transport.server.scheme);
    via += " " + ua.configuration.viaHost + ";branch=" + id;
    if (ua.configuration.forceRport) {
        via += ";rport";
    }
    return via;
};
/**
 * @class Non Invite Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
var NonInviteClientTransaction = /** @class */ (function (_super) {
    __extends(NonInviteClientTransaction, _super);
    function NonInviteClientTransaction(requestSender, request, transport) {
        var _this = _super.call(this) || this;
        _this.kind = C.NON_INVITE_CLIENT;
        _this.type = Enums_1.TypeStrings.NonInviteClientTransaction;
        _this.transport = transport;
        _this.id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
        _this.requestSender = requestSender;
        _this.request = request;
        _this.logger = requestSender.ua.getLogger("sip.transaction.nict", _this.id);
        var via = buildViaHeader(requestSender.ua, transport, _this.id);
        _this.request.setHeader("via", via);
        _this.requestSender.ua.newTransaction(_this);
        return _this;
    }
    NonInviteClientTransaction.prototype.stateChanged = function (state) {
        this.state = state;
        this.emit("stateChanged");
    };
    NonInviteClientTransaction.prototype.send = function () {
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TRYING);
        this.F = setTimeout(this.timer_F.bind(this), Timers_1.Timers.TIMER_F);
        this.transport.send(this.request).catch(this.onTransportError);
    };
    NonInviteClientTransaction.prototype.receiveResponse = function (response) {
        var statusCode = response.statusCode || 0;
        if (statusCode < 200) {
            switch (this.state) {
                case Enums_1.TransactionStatus.STATUS_TRYING:
                case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                    this.stateChanged(Enums_1.TransactionStatus.STATUS_PROCEEDING);
                    this.requestSender.receiveResponse(response);
                    break;
            }
        }
        else {
            switch (this.state) {
                case Enums_1.TransactionStatus.STATUS_TRYING:
                case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                    this.stateChanged(Enums_1.TransactionStatus.STATUS_COMPLETED);
                    if (this.F) {
                        clearTimeout(this.F);
                    }
                    if (statusCode === 408) {
                        this.requestSender.onRequestTimeout();
                    }
                    else {
                        this.requestSender.receiveResponse(response);
                    }
                    this.K = setTimeout(this.timer_K.bind(this), Timers_1.Timers.TIMER_K);
                    break;
                case Enums_1.TransactionStatus.STATUS_COMPLETED:
                    break;
            }
        }
    };
    NonInviteClientTransaction.prototype.onTransportError = function () {
        this.logger.log("transport error occurred, deleting non-INVITE client transaction " + this.id);
        if (this.F) {
            clearTimeout(this.F);
            this.F = undefined;
        }
        if (this.K) {
            clearTimeout(this.K);
            this.K = undefined;
        }
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.requestSender.ua.destroyTransaction(this);
        this.requestSender.onTransportError();
    };
    NonInviteClientTransaction.prototype.timer_F = function () {
        this.logger.debug("Timer F expired for non-INVITE client transaction " + this.id);
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.requestSender.ua.destroyTransaction(this);
        this.requestSender.onRequestTimeout();
    };
    NonInviteClientTransaction.prototype.timer_K = function () {
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.requestSender.ua.destroyTransaction(this);
    };
    return NonInviteClientTransaction;
}(events_1.EventEmitter));
exports.NonInviteClientTransaction = NonInviteClientTransaction;
/**
 * @class Invite Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
// tslint:disable-next-line:max-classes-per-file
var InviteClientTransaction = /** @class */ (function (_super) {
    __extends(InviteClientTransaction, _super);
    function InviteClientTransaction(requestSender, request, transport) {
        var _this = _super.call(this) || this;
        _this.kind = C.INVITE_CLIENT;
        _this.type = Enums_1.TypeStrings.InviteClientTransaction;
        _this.transport = transport;
        _this.id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
        _this.requestSender = requestSender;
        _this.request = request;
        _this.logger = requestSender.ua.getLogger("sip.transaction.ict", _this.id);
        var via = buildViaHeader(requestSender.ua, transport, _this.id);
        _this.request.setHeader("via", via);
        _this.requestSender.ua.newTransaction(_this);
        // Add the cancel property to the request.
        // Will be called from the request instance, not the transaction itself.
        _this.request.cancel = function (reason, extraHeaders) {
            extraHeaders = (extraHeaders || []).slice();
            var extraHeadersString = "";
            for (var _i = 0, extraHeaders_1 = extraHeaders; _i < extraHeaders_1.length; _i++) {
                var extraHeader = extraHeaders_1[_i];
                extraHeadersString += extraHeader.trim() + "\r\n";
            }
            _this.cancelRequest(_this, reason, extraHeadersString);
        };
        return _this;
    }
    InviteClientTransaction.prototype.stateChanged = function (state) {
        this.state = state;
        this.emit("stateChanged");
    };
    InviteClientTransaction.prototype.send = function () {
        this.stateChanged(Enums_1.TransactionStatus.STATUS_CALLING);
        this.B = setTimeout(this.timer_B.bind(this), Timers_1.Timers.TIMER_B);
        this.transport.send(this.request).catch(this.onTransportError);
    };
    InviteClientTransaction.prototype.receiveResponse = function (response) {
        var statusCode = response.statusCode || 0;
        // This may create a circular dependency...
        response.transaction = this;
        if (this.response &&
            this.response.statusCode === response.statusCode &&
            this.response.cseq === response.cseq) {
            this.logger.debug("ICT Received a retransmission for cseq: " + response.cseq);
            if (this.ackSender) {
                this.ackSender.send();
            }
            return;
        }
        this.response = response;
        if (statusCode >= 100 && statusCode <= 199) {
            switch (this.state) {
                case Enums_1.TransactionStatus.STATUS_CALLING:
                    this.stateChanged(Enums_1.TransactionStatus.STATUS_PROCEEDING);
                    this.requestSender.receiveResponse(response);
                    if (this.cancel) {
                        this.transport.send(this.cancel);
                    }
                    break;
                case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                    this.requestSender.receiveResponse(response);
                    break;
            }
        }
        else if (statusCode >= 200 && statusCode <= 299) {
            switch (this.state) {
                case Enums_1.TransactionStatus.STATUS_CALLING:
                case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                    this.stateChanged(Enums_1.TransactionStatus.STATUS_ACCEPTED);
                    this.M = setTimeout(this.timer_M.bind(this), Timers_1.Timers.TIMER_M);
                    this.requestSender.receiveResponse(response);
                    break;
                case C.STATUS_ACCEPTED:
                    this.requestSender.receiveResponse(response);
                    break;
            }
        }
        else if (statusCode >= 300 && statusCode <= 699) {
            switch (this.state) {
                case Enums_1.TransactionStatus.STATUS_CALLING:
                case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                    this.stateChanged(Enums_1.TransactionStatus.STATUS_COMPLETED);
                    this.sendACK();
                    this.requestSender.receiveResponse(response);
                    break;
                case Enums_1.TransactionStatus.STATUS_COMPLETED:
                    this.sendACK();
                    break;
            }
        }
    };
    InviteClientTransaction.prototype.sendACK = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        // TODO: Move PRACK stuff into the transaction layer. That is really where it should be
        var ruri;
        if (this.response && this.response.getHeader("contact")) {
            ruri = this.response.parseHeader("contact").uri;
        }
        else {
            ruri = this.request.ruri;
        }
        if (this.response) {
            var ack = new SIPMessage_1.OutgoingRequest("ACK", ruri.toString(), this.request.ua, {
                cseq: this.response.cseq,
                callId: this.response.callId,
                fromUri: this.response.from.uri,
                fromTag: this.response.fromTag,
                toUri: this.response.to.uri,
                toTag: this.response.toTag,
                routeSet: this.response.getHeaders("record-route").reverse()
            }, options.extraHeaders || [], options.body);
            if (!ack.ua.transport) {
                throw new Error("No transport to make transaction");
            }
            this.ackSender = new AckClientTransaction({
                onTransportError: this.requestSender.applicant ?
                    this.requestSender.applicant.onTransportError :
                    function () {
                        _this.logger.warn("ACK Request had a transport error");
                    },
                ua: ack.ua
            }, ack, ack.ua.transport);
            this.ackSender.send();
            return ack;
        }
    };
    InviteClientTransaction.prototype.onTransportError = function () {
        this.logger.log("transport error occurred, deleting INVITE client transaction " + this.id);
        if (this.B) {
            clearTimeout(this.B);
            this.B = undefined;
        }
        if (this.D) {
            clearTimeout(this.D);
            this.D = undefined;
        }
        if (this.M) {
            clearTimeout(this.M);
            this.M = undefined;
        }
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.requestSender.ua.destroyTransaction(this);
        if (this.state !== Enums_1.TransactionStatus.STATUS_ACCEPTED) {
            this.requestSender.onTransportError();
        }
    };
    // RFC 6026 7.2
    InviteClientTransaction.prototype.timer_M = function () {
        this.logger.debug("Timer M expired for INVITE client transaction " + this.id);
        if (this.state === Enums_1.TransactionStatus.STATUS_ACCEPTED) {
            if (this.B) {
                clearTimeout(this.B);
                this.B = undefined;
            }
            this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
            this.requestSender.ua.destroyTransaction(this);
        }
    };
    // RFC 3261 17.1.1
    InviteClientTransaction.prototype.timer_B = function () {
        this.logger.debug("Timer B expired for INVITE client transaction " + this.id);
        if (this.state === Enums_1.TransactionStatus.STATUS_CALLING) {
            this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
            this.requestSender.ua.destroyTransaction(this);
            this.requestSender.onRequestTimeout();
        }
    };
    InviteClientTransaction.prototype.timer_D = function () {
        this.logger.debug("Timer D expired for INVITE client transaction " + this.id);
        if (this.B) {
            clearTimeout(this.B);
            this.B = undefined;
        }
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.requestSender.ua.destroyTransaction(this);
    };
    InviteClientTransaction.prototype.cancelRequest = function (tr, reason, extraHeaders) {
        var request = tr.request;
        this.cancel = Constants_1.C.CANCEL + " " + request.ruri + " SIP/2.0\r\n";
        this.cancel += "Via: " + request.headers.Via.toString() + "\r\n";
        if (this.request.headers.Route) {
            this.cancel += "Route: " + request.headers.Route.toString() + "\r\n";
        }
        this.cancel += "To: " + request.headers.To.toString() + "\r\n";
        this.cancel += "From: " + request.headers.From.toString() + "\r\n";
        this.cancel += "Call-ID: " + request.headers["Call-ID"].toString() + "\r\n";
        // a constant in UA.C, removed for circular dependency
        this.cancel += "Max-Forwards: " + 70 + "\r\n";
        this.cancel += "CSeq: " + request.headers.CSeq.toString().split(" ")[0] +
            " CANCEL\r\n";
        if (reason) {
            this.cancel += "Reason: " + reason + "\r\n";
        }
        if (extraHeaders) {
            this.cancel += extraHeaders;
        }
        this.cancel += "Content-Length: 0\r\n\r\n";
        // Send only if a provisional response (>100) has been received.
        if (this.state === Enums_1.TransactionStatus.STATUS_PROCEEDING) {
            this.transport.send(this.cancel);
        }
    };
    return InviteClientTransaction;
}(events_1.EventEmitter));
exports.InviteClientTransaction = InviteClientTransaction;
/**
 * @class ACK Client Transaction
 * @param {SIP.RequestSender} request_sender
 * @param {SIP.OutgoingRequest} request
 * @param {SIP.Transport} transport
 */
// tslint:disable-next-line:max-classes-per-file
var AckClientTransaction = /** @class */ (function (_super) {
    __extends(AckClientTransaction, _super);
    function AckClientTransaction(requestSender, request, transport) {
        var _this = _super.call(this) || this;
        _this.type = Enums_1.TypeStrings.AckClientTransaction;
        _this.transport = transport;
        _this.id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
        _this.requestSender = requestSender;
        _this.request = request;
        _this.logger = requestSender.ua.getLogger("sip.transaction.nict", _this.id);
        var via = buildViaHeader(requestSender.ua, transport, _this.id);
        _this.request.setHeader("via", via);
        return _this;
    }
    AckClientTransaction.prototype.send = function () {
        var _this = this;
        this.transport.send(this.request).catch(function () {
            _this.logger.log("transport error occurred, for an ACK client transaction " + _this.id);
            _this.requestSender.onTransportError();
        });
    };
    return AckClientTransaction;
}(events_1.EventEmitter));
exports.AckClientTransaction = AckClientTransaction;
/**
 * @class Non Invite Server Transaction
 * @param {SIP.IncomingRequest} request
 * @param {SIP.UA} ua
 */
// tslint:disable-next-line:max-classes-per-file
var NonInviteServerTransaction = /** @class */ (function (_super) {
    __extends(NonInviteServerTransaction, _super);
    function NonInviteServerTransaction(request, ua) {
        var _this = _super.call(this) || this;
        _this.kind = C.NON_INVITE_SERVER;
        _this.type = Enums_1.TypeStrings.NonInviteServerTransaction;
        _this.id = request.viaBranch;
        _this.request = request;
        _this.transport = ua.transport;
        _this.ua = ua;
        _this.lastResponse = "";
        _this.transportError = false;
        request.serverTransaction = _this;
        _this.logger = ua.getLogger("sip.transaction.nist", _this.id);
        _this.state = Enums_1.TransactionStatus.STATUS_TRYING;
        ua.newTransaction(_this);
        return _this;
    }
    NonInviteServerTransaction.prototype.stateChanged = function (state) {
        this.state = state;
        this.emit("stateChanged");
    };
    NonInviteServerTransaction.prototype.receiveResponse = function (statusCode, response) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (statusCode === 100) {
                /* RFC 4320 4.1
                 * 'A SIP element MUST NOT
                 * send any provisional response with a
                 * Status-Code other than 100 to a non-INVITE request.'
                 */
                switch (_this.state) {
                    case Enums_1.TransactionStatus.STATUS_TRYING:
                        _this.stateChanged(C.STATUS_PROCEEDING);
                        if (_this.transport) {
                            _this.transport.send(response).catch(_this.onTransportError);
                        }
                        break;
                    case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                        _this.lastResponse = response;
                        if (_this.transport) {
                            _this.transport.send(response).then(resolve).catch(function () {
                                _this.onTransportError();
                                reject();
                            });
                        }
                        break;
                }
            }
            else if (statusCode >= 200 && statusCode <= 699) {
                switch (_this.state) {
                    case Enums_1.TransactionStatus.STATUS_TRYING:
                    case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                        _this.stateChanged(C.STATUS_COMPLETED);
                        _this.lastResponse = response;
                        _this.J = setTimeout(function () {
                            _this.logger.debug("Timer J expired for non-INVITE server transaction " + _this.id);
                            _this.stateChanged(C.STATUS_TERMINATED);
                            _this.ua.destroyTransaction(_this);
                        }, Timers_1.Timers.TIMER_J);
                        if (_this.transport) {
                            _this.transport.send(response).then(resolve).catch(function () {
                                _this.onTransportError();
                                reject();
                            });
                        }
                        break;
                    case Enums_1.TransactionStatus.STATUS_COMPLETED:
                        break;
                }
            }
        });
    };
    NonInviteServerTransaction.prototype.onTransportError = function () {
        if (!this.transportError) {
            this.transportError = true;
            this.logger.log("transport error occurred, deleting non-INVITE server transaction " + this.id);
            if (this.J) {
                clearTimeout(this.J);
                this.J = undefined;
            }
            this.stateChanged(C.STATUS_TERMINATED);
            this.ua.destroyTransaction(this);
        }
    };
    return NonInviteServerTransaction;
}(events_1.EventEmitter));
exports.NonInviteServerTransaction = NonInviteServerTransaction;
/**
 * @class Invite Server Transaction
 * @param {SIP.IncomingRequest} request
 * @param {SIP.UA} ua
 */
// tslint:disable-next-line:max-classes-per-file
var InviteServerTransaction = /** @class */ (function (_super) {
    __extends(InviteServerTransaction, _super);
    function InviteServerTransaction(request, ua) {
        var _this = _super.call(this) || this;
        _this.kind = C.INVITE_SERVER;
        _this.type = Enums_1.TypeStrings.InviteServerTransaction;
        _this.id = request.viaBranch;
        _this.request = request;
        _this.transport = ua.transport;
        _this.ua = ua;
        _this.lastResponse = "";
        _this.transportError = false;
        request.serverTransaction = _this;
        _this.logger = ua.getLogger("sip.transaction.ist", _this.id);
        _this.state = Enums_1.TransactionStatus.STATUS_PROCEEDING;
        ua.newTransaction(_this);
        request.reply(100);
        return _this;
    }
    InviteServerTransaction.prototype.stateChanged = function (state) {
        this.state = state;
        this.emit("stateChanged");
    };
    InviteServerTransaction.prototype.timer_I = function () {
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.ua.destroyTransaction(this);
    };
    // INVITE Server Transaction RFC 3261 17.2.1
    InviteServerTransaction.prototype.receiveResponse = function (statusCode, response) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (statusCode >= 100 && statusCode <= 199 && _this.state === Enums_1.TransactionStatus.STATUS_PROCEEDING) {
                // PLEASE FIX: this condition leads to a hanging promise. I'm leaving it to preserve behavior as I clean up
                if (_this.transport) {
                    _this.transport.send(response).catch(_this.onTransportError);
                }
                _this.lastResponse = response;
                // this 100 split is carry-over from old logic, I have no explanation
                if (statusCode > 100) {
                    // Trigger the resendProvisionalTimer only for the first non 100 provisional response.
                    if (_this.resendProvisionalTimer === undefined) {
                        _this.resendProvisionalTimer = setInterval(function () {
                            if (_this.transport) {
                                _this.transport.send(response).catch(function () {
                                    _this.onTransportError();
                                });
                            }
                        }, Timers_1.Timers.PROVISIONAL_RESPONSE_INTERVAL);
                    }
                }
            }
            else if (statusCode >= 200 && statusCode <= 299) {
                switch (_this.state) {
                    case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                        _this.stateChanged(C.STATUS_ACCEPTED);
                        _this.lastResponse = response;
                        _this.L = setTimeout(_this.timer_L.bind(_this), Timers_1.Timers.TIMER_L);
                        if (_this.resendProvisionalTimer !== undefined) {
                            clearInterval(_this.resendProvisionalTimer);
                            _this.resendProvisionalTimer = undefined;
                        }
                    /* falls through */
                    case Enums_1.TransactionStatus.STATUS_ACCEPTED:
                        // Note that this point will be reached for proceeding this.state also.
                        if (_this.transport) {
                            _this.transport.send(response).then(resolve).catch(function (error) {
                                _this.logger.error(error);
                                _this.onTransportError();
                                reject();
                            });
                        }
                        break;
                }
            }
            else if (statusCode >= 300 && statusCode <= 699) {
                switch (_this.state) {
                    case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                        if (_this.resendProvisionalTimer !== undefined) {
                            clearInterval(_this.resendProvisionalTimer);
                            _this.resendProvisionalTimer = undefined;
                        }
                        if (_this.transport) {
                            _this.transport.send(response).then(function () {
                                _this.stateChanged(Enums_1.TransactionStatus.STATUS_COMPLETED);
                                _this.H = setTimeout(_this.timer_H.bind(_this), Timers_1.Timers.TIMER_H);
                                resolve();
                            }).catch(function (error) {
                                _this.logger.error(error);
                                _this.onTransportError();
                                reject();
                            });
                        }
                        break;
                }
            }
        });
    };
    InviteServerTransaction.prototype.timer_H = function () {
        this.logger.debug("Timer H expired for INVITE server transaction " + this.id);
        if (this.state === Enums_1.TransactionStatus.STATUS_COMPLETED) {
            this.logger.warn("transactions: ACK for INVITE server transaction was never received, call will be terminated");
        }
        this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
        this.ua.destroyTransaction(this);
    };
    // RFC 6026 7.1
    InviteServerTransaction.prototype.timer_L = function () {
        this.logger.debug("Timer L expired for INVITE server transaction " + this.id);
        if (this.state === Enums_1.TransactionStatus.STATUS_ACCEPTED) {
            this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
            this.ua.destroyTransaction(this);
        }
    };
    InviteServerTransaction.prototype.onTransportError = function () {
        if (!this.transportError) {
            this.transportError = true;
            this.logger.log("transport error occurred, deleting INVITE server transaction " + this.id);
            if (this.resendProvisionalTimer !== undefined) {
                clearInterval(this.resendProvisionalTimer);
                this.resendProvisionalTimer = undefined;
            }
            if (this.L) {
                clearTimeout(this.L);
                this.L = undefined;
            }
            if (this.H) {
                clearTimeout(this.H);
                this.H = undefined;
            }
            if (this.I) {
                clearTimeout(this.I);
                this.I = undefined;
            }
            this.stateChanged(Enums_1.TransactionStatus.STATUS_TERMINATED);
            this.ua.destroyTransaction(this);
        }
    };
    return InviteServerTransaction;
}(events_1.EventEmitter));
exports.InviteServerTransaction = InviteServerTransaction;
/**
 * @function
 * @param {SIP.UA} ua
 * @param {SIP.IncomingRequest} request
 *
 * @return {boolean}
 * INVITE:
 *  _true_ if retransmission
 *  _false_ new request
 *
 * ACK:
 *  _true_  ACK to non2xx response
 *  _false_ ACK must be passed to TU (accepted state)
 *          ACK to 2xx response
 *
 * CANCEL:
 *  _true_  no matching invite transaction
 *  _false_ matching invite transaction and no final response sent
 *
 * OTHER:
 *  _true_  retransmission
 *  _false_ new request
 */
function checkTransaction(ua, request) {
    var inviteServertr = ua.transactions.ist[request.viaBranch];
    switch (request.method) {
        case Constants_1.C.INVITE:
            if (inviteServertr) {
                switch (inviteServertr.state) {
                    case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                        if (inviteServertr.transport) {
                            inviteServertr.transport.send(inviteServertr.lastResponse);
                        }
                        break;
                    // RFC 6026 7.1 Invite retransmission
                    // received while in C.STATUS_ACCEPTED state. Absorb it.
                    case Enums_1.TransactionStatus.STATUS_ACCEPTED:
                        break;
                }
                return true;
            }
            break;
        case Constants_1.C.ACK:
            // RFC 6026 7.1
            if (inviteServertr) {
                if (inviteServertr.state === Enums_1.TransactionStatus.STATUS_ACCEPTED) {
                    return false;
                }
                else if (inviteServertr.state === Enums_1.TransactionStatus.STATUS_COMPLETED) {
                    inviteServertr.stateChanged(Enums_1.TransactionStatus.STATUS_CONFIRMED);
                    inviteServertr.I = setTimeout(inviteServertr.timer_I.bind(inviteServertr), Timers_1.Timers.TIMER_I);
                    return true;
                }
            }
            else { // ACK to 2XX Response.
                return false;
            }
            break;
        case Constants_1.C.CANCEL:
            if (inviteServertr) {
                request.reply_sl(200);
                if (inviteServertr.state === Enums_1.TransactionStatus.STATUS_PROCEEDING) {
                    return false;
                }
                else {
                    return true;
                }
            }
            else {
                request.reply_sl(481);
                return true;
            }
        default:
            // Non-INVITE Server Transaction RFC 3261 17.2.2
            var nist = ua.transactions.nist[request.viaBranch];
            if (nist) {
                switch (nist.state) {
                    case Enums_1.TransactionStatus.STATUS_TRYING:
                        break;
                    case Enums_1.TransactionStatus.STATUS_PROCEEDING:
                    case Enums_1.TransactionStatus.STATUS_COMPLETED:
                        if (nist.transport) {
                            nist.transport.send(nist.lastResponse);
                        }
                        break;
                }
                return true;
            }
            break;
    }
    return false;
}
exports.checkTransaction = checkTransaction;
