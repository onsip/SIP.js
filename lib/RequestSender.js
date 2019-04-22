"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Constants_1 = require("./Constants");
var Enums_1 = require("./Enums");
var Transactions_1 = require("./Transactions");
/**
 * @class Class creating a request sender.
 * @param {Object} applicant
 * @param {SIP.UA} ua
 */
var RequestSender = /** @class */ (function () {
    function RequestSender(applicant, ua) {
        this.type = Enums_1.TypeStrings.RequestSender;
        this.logger = ua.getLogger("sip.requestsender");
        this.loggerFactory = ua.getLoggerFactory();
        this.ua = ua;
        this.applicant = applicant;
        this.method = applicant.request.method;
        this.request = applicant.request;
        this.credentials = undefined;
        this.challenged = false;
        this.staled = false;
        // If ua is in closing process or even closed just allow sending Bye and ACK
        if (ua.status === Enums_1.UAStatus.STATUS_USER_CLOSED && (this.method !== Constants_1.C.BYE && this.method !== Constants_1.C.ACK)) {
            this.onTransportError();
        }
    }
    /**
     * Create the client transaction and send the message.
     */
    RequestSender.prototype.send = function () {
        var _this = this;
        var transport = this.ua.transport;
        if (!transport) {
            throw new Error("Transport undefined.");
        }
        var user = {
            loggerFactory: this.ua.getLoggerFactory(),
            onRequestTimeout: function () { return _this.onRequestTimeout(); },
            onStateChange: function (newState) {
                if (newState === Transactions_1.TransactionState.Terminated) {
                    _this.ua.destroyTransaction(clientTransaction);
                }
            },
            onTransportError: function (error) { return _this.onTransportError(); },
            receiveResponse: function (response) { return _this.receiveResponse(response); }
        };
        var clientTransaction;
        switch (this.method) {
            case "INVITE":
                clientTransaction = new Transactions_1.InviteClientTransaction(this.request, transport, user);
                break;
            case "ACK":
                throw new Error("Cannot make client transaction for ACK method.");
            default:
                clientTransaction = new Transactions_1.NonInviteClientTransaction(this.request, transport, user);
        }
        this.clientTransaction = clientTransaction;
        this.ua.newTransaction(clientTransaction);
        return clientTransaction;
    };
    /**
     * Callback fired when receiving a request timeout error from the client transaction.
     * To be re-defined by the applicant.
     * @event
     */
    RequestSender.prototype.onRequestTimeout = function () {
        this.applicant.onRequestTimeout();
    };
    /**
     * Callback fired when receiving a transport error from the client transaction.
     * To be re-defined by the applicant.
     * @event
     */
    RequestSender.prototype.onTransportError = function () {
        this.applicant.onTransportError();
    };
    /**
     * Called from client transaction when receiving a correct response to the request.
     * Authenticate request if needed or pass the response back to the applicant.
     * @param {SIP.IncomingResponse} response
     */
    RequestSender.prototype.receiveResponse = function (response) {
        var statusCode = response && response.statusCode ? response.statusCode : 0;
        /*
        * Authentication
        * Authenticate once. _challenged_ flag used to avoid infinite authentications.
        */
        if (statusCode === 401 || statusCode === 407) {
            var challenge = void 0;
            var authorizationHeaderName = void 0;
            // Get and parse the appropriate WWW-Authenticate or Proxy-Authenticate header.
            if (statusCode === 401) {
                challenge = response.parseHeader("www-authenticate");
                authorizationHeaderName = "authorization";
            }
            else {
                challenge = response.parseHeader("proxy-authenticate");
                authorizationHeaderName = "proxy-authorization";
            }
            // Verify it seems a valid challenge.
            if (!challenge) {
                this.logger.warn(statusCode + " with wrong or missing challenge, cannot authenticate");
                this.applicant.receiveResponse(response);
                return;
            }
            if (!this.challenged || (!this.staled && challenge.stale === true)) {
                if (!this.credentials && this.ua.configuration.authenticationFactory) {
                    this.credentials = this.ua.configuration.authenticationFactory(this.ua);
                }
                // Verify that the challenge is really valid.
                if (!this.credentials.authenticate(this.request, challenge)) {
                    this.applicant.receiveResponse(response);
                    return;
                }
                this.challenged = true;
                if (challenge.stale) {
                    this.staled = true;
                }
                var cseq = void 0;
                if (response.method === Constants_1.C.REGISTER) {
                    cseq = this.applicant.cseq += 1;
                }
                else if (this.request.dialog) {
                    cseq = this.request.dialog.localSeqnum += 1;
                }
                else {
                    cseq = (this.request.cseq || 0) + 1;
                    this.request.cseq = cseq;
                }
                this.request.setHeader("cseq", cseq + " " + this.method);
                this.request.setHeader(authorizationHeaderName, this.credentials.toString());
                this.send();
            }
            else {
                this.applicant.receiveResponse(response);
            }
        }
        else {
            this.applicant.receiveResponse(response);
        }
    };
    return RequestSender;
}());
exports.RequestSender = RequestSender;
