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
var TypeStrings;
(function (TypeStrings) {
    TypeStrings[TypeStrings["ClientContext"] = 0] = "ClientContext";
    TypeStrings[TypeStrings["ConfigurationError"] = 1] = "ConfigurationError";
    TypeStrings[TypeStrings["Dialog"] = 2] = "Dialog";
    TypeStrings[TypeStrings["DigestAuthentication"] = 3] = "DigestAuthentication";
    TypeStrings[TypeStrings["DTMF"] = 4] = "DTMF";
    TypeStrings[TypeStrings["IncomingMessage"] = 5] = "IncomingMessage";
    TypeStrings[TypeStrings["IncomingRequest"] = 6] = "IncomingRequest";
    TypeStrings[TypeStrings["IncomingResponse"] = 7] = "IncomingResponse";
    TypeStrings[TypeStrings["InvalidStateError"] = 8] = "InvalidStateError";
    TypeStrings[TypeStrings["InviteClientContext"] = 9] = "InviteClientContext";
    TypeStrings[TypeStrings["InviteServerContext"] = 10] = "InviteServerContext";
    TypeStrings[TypeStrings["Logger"] = 11] = "Logger";
    TypeStrings[TypeStrings["LoggerFactory"] = 12] = "LoggerFactory";
    TypeStrings[TypeStrings["MethodParameterError"] = 13] = "MethodParameterError";
    TypeStrings[TypeStrings["NameAddrHeader"] = 14] = "NameAddrHeader";
    TypeStrings[TypeStrings["NotSupportedError"] = 15] = "NotSupportedError";
    TypeStrings[TypeStrings["OutgoingRequest"] = 16] = "OutgoingRequest";
    TypeStrings[TypeStrings["Parameters"] = 17] = "Parameters";
    TypeStrings[TypeStrings["PublishContext"] = 18] = "PublishContext";
    TypeStrings[TypeStrings["ReferClientContext"] = 19] = "ReferClientContext";
    TypeStrings[TypeStrings["ReferServerContext"] = 20] = "ReferServerContext";
    TypeStrings[TypeStrings["RegisterContext"] = 21] = "RegisterContext";
    TypeStrings[TypeStrings["RenegotiationError"] = 22] = "RenegotiationError";
    TypeStrings[TypeStrings["RequestSender"] = 23] = "RequestSender";
    TypeStrings[TypeStrings["ServerContext"] = 24] = "ServerContext";
    TypeStrings[TypeStrings["Session"] = 25] = "Session";
    TypeStrings[TypeStrings["SessionDescriptionHandler"] = 26] = "SessionDescriptionHandler";
    TypeStrings[TypeStrings["SessionDescriptionHandlerError"] = 27] = "SessionDescriptionHandlerError";
    TypeStrings[TypeStrings["SessionDescriptionHandlerObserver"] = 28] = "SessionDescriptionHandlerObserver";
    TypeStrings[TypeStrings["Subscription"] = 29] = "Subscription";
    TypeStrings[TypeStrings["Transport"] = 30] = "Transport";
    TypeStrings[TypeStrings["UA"] = 31] = "UA";
    TypeStrings[TypeStrings["URI"] = 32] = "URI";
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
