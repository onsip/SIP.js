"use strict";
// enums can't really be declared, so they are set here.
// pulled out of individual files to avoid circular dependencies
Object.defineProperty(exports, "__esModule", { value: true });
var DialogStatus;
(function (DialogStatus) {
    DialogStatus[DialogStatus["STATUS_EARLY"] = 1] = "STATUS_EARLY";
    DialogStatus[DialogStatus["STATUS_CONFIRMED"] = 2] = "STATUS_CONFIRMED";
})(DialogStatus = exports.DialogStatus || (exports.DialogStatus = {}));
var SessionStatus;
(function (SessionStatus) {
    // Session states
    SessionStatus[SessionStatus["STATUS_NULL"] = 0] = "STATUS_NULL";
    SessionStatus[SessionStatus["STATUS_INVITE_SENT"] = 1] = "STATUS_INVITE_SENT";
    SessionStatus[SessionStatus["STATUS_1XX_RECEIVED"] = 2] = "STATUS_1XX_RECEIVED";
    SessionStatus[SessionStatus["STATUS_INVITE_RECEIVED"] = 3] = "STATUS_INVITE_RECEIVED";
    SessionStatus[SessionStatus["STATUS_WAITING_FOR_ANSWER"] = 4] = "STATUS_WAITING_FOR_ANSWER";
    SessionStatus[SessionStatus["STATUS_ANSWERED"] = 5] = "STATUS_ANSWERED";
    SessionStatus[SessionStatus["STATUS_WAITING_FOR_PRACK"] = 6] = "STATUS_WAITING_FOR_PRACK";
    SessionStatus[SessionStatus["STATUS_WAITING_FOR_ACK"] = 7] = "STATUS_WAITING_FOR_ACK";
    SessionStatus[SessionStatus["STATUS_CANCELED"] = 8] = "STATUS_CANCELED";
    SessionStatus[SessionStatus["STATUS_TERMINATED"] = 9] = "STATUS_TERMINATED";
    SessionStatus[SessionStatus["STATUS_ANSWERED_WAITING_FOR_PRACK"] = 10] = "STATUS_ANSWERED_WAITING_FOR_PRACK";
    SessionStatus[SessionStatus["STATUS_EARLY_MEDIA"] = 11] = "STATUS_EARLY_MEDIA";
    SessionStatus[SessionStatus["STATUS_CONFIRMED"] = 12] = "STATUS_CONFIRMED";
})(SessionStatus = exports.SessionStatus || (exports.SessionStatus = {}));
var TransactionStatus;
(function (TransactionStatus) {
    // Transaction states
    TransactionStatus[TransactionStatus["STATUS_TRYING"] = 1] = "STATUS_TRYING";
    TransactionStatus[TransactionStatus["STATUS_PROCEEDING"] = 2] = "STATUS_PROCEEDING";
    TransactionStatus[TransactionStatus["STATUS_CALLING"] = 3] = "STATUS_CALLING";
    TransactionStatus[TransactionStatus["STATUS_ACCEPTED"] = 4] = "STATUS_ACCEPTED";
    TransactionStatus[TransactionStatus["STATUS_COMPLETED"] = 5] = "STATUS_COMPLETED";
    TransactionStatus[TransactionStatus["STATUS_TERMINATED"] = 6] = "STATUS_TERMINATED";
    TransactionStatus[TransactionStatus["STATUS_CONFIRMED"] = 7] = "STATUS_CONFIRMED";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
var TypeStrings;
(function (TypeStrings) {
    TypeStrings[TypeStrings["AckClientTransaction"] = 0] = "AckClientTransaction";
    TypeStrings[TypeStrings["ClientContext"] = 1] = "ClientContext";
    TypeStrings[TypeStrings["ConfigurationError"] = 2] = "ConfigurationError";
    TypeStrings[TypeStrings["Dialog"] = 3] = "Dialog";
    TypeStrings[TypeStrings["DigestAuthentication"] = 4] = "DigestAuthentication";
    TypeStrings[TypeStrings["DTMF"] = 5] = "DTMF";
    TypeStrings[TypeStrings["IncomingMessage"] = 6] = "IncomingMessage";
    TypeStrings[TypeStrings["IncomingRequest"] = 7] = "IncomingRequest";
    TypeStrings[TypeStrings["IncomingResponse"] = 8] = "IncomingResponse";
    TypeStrings[TypeStrings["InvalidStateError"] = 9] = "InvalidStateError";
    TypeStrings[TypeStrings["InviteClientContext"] = 10] = "InviteClientContext";
    TypeStrings[TypeStrings["InviteClientTransaction"] = 11] = "InviteClientTransaction";
    TypeStrings[TypeStrings["InviteServerContext"] = 12] = "InviteServerContext";
    TypeStrings[TypeStrings["InviteServerTransaction"] = 13] = "InviteServerTransaction";
    TypeStrings[TypeStrings["Logger"] = 14] = "Logger";
    TypeStrings[TypeStrings["LoggerFactory"] = 15] = "LoggerFactory";
    TypeStrings[TypeStrings["MethodParameterError"] = 16] = "MethodParameterError";
    TypeStrings[TypeStrings["NameAddrHeader"] = 17] = "NameAddrHeader";
    TypeStrings[TypeStrings["NonInviteClientTransaction"] = 18] = "NonInviteClientTransaction";
    TypeStrings[TypeStrings["NonInviteServerTransaction"] = 19] = "NonInviteServerTransaction";
    TypeStrings[TypeStrings["NotSupportedError"] = 20] = "NotSupportedError";
    TypeStrings[TypeStrings["OutgoingRequest"] = 21] = "OutgoingRequest";
    TypeStrings[TypeStrings["Parameters"] = 22] = "Parameters";
    TypeStrings[TypeStrings["PublishContext"] = 23] = "PublishContext";
    TypeStrings[TypeStrings["ReferClientContext"] = 24] = "ReferClientContext";
    TypeStrings[TypeStrings["ReferServerContext"] = 25] = "ReferServerContext";
    TypeStrings[TypeStrings["RegisterContext"] = 26] = "RegisterContext";
    TypeStrings[TypeStrings["RenegotiationError"] = 27] = "RenegotiationError";
    TypeStrings[TypeStrings["RequestSender"] = 28] = "RequestSender";
    TypeStrings[TypeStrings["ServerContext"] = 29] = "ServerContext";
    TypeStrings[TypeStrings["Session"] = 30] = "Session";
    TypeStrings[TypeStrings["SessionDescriptionHandler"] = 31] = "SessionDescriptionHandler";
    TypeStrings[TypeStrings["SessionDescriptionHandlerError"] = 32] = "SessionDescriptionHandlerError";
    TypeStrings[TypeStrings["SessionDescriptionHandlerObserver"] = 33] = "SessionDescriptionHandlerObserver";
    TypeStrings[TypeStrings["Subscription"] = 34] = "Subscription";
    TypeStrings[TypeStrings["Transport"] = 35] = "Transport";
    TypeStrings[TypeStrings["TransportError"] = 36] = "TransportError";
    TypeStrings[TypeStrings["UA"] = 37] = "UA";
    TypeStrings[TypeStrings["URI"] = 38] = "URI";
})(TypeStrings = exports.TypeStrings || (exports.TypeStrings = {}));
// UA status codes
var UAStatus;
(function (UAStatus) {
    UAStatus[UAStatus["STATUS_INIT"] = 0] = "STATUS_INIT";
    UAStatus[UAStatus["STATUS_STARTING"] = 1] = "STATUS_STARTING";
    UAStatus[UAStatus["STATUS_READY"] = 2] = "STATUS_READY";
    UAStatus[UAStatus["STATUS_USER_CLOSED"] = 3] = "STATUS_USER_CLOSED";
    UAStatus[UAStatus["STATUS_NOT_READY"] = 4] = "STATUS_NOT_READY";
})(UAStatus = exports.UAStatus || (exports.UAStatus = {}));
