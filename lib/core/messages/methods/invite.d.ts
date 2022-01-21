import { Session } from "../../session";
import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest, OutgoingRequestDelegate, RequestOptions } from "../outgoing-request";
import { OutgoingResponse, ResponseOptions } from "../outgoing-response";
import { OutgoingAckRequest } from "./ack";
import { OutgoingPrackRequest } from "./prack";
/** INVITE message sent from remote client to local server. */
export interface IncomingInviteRequest extends IncomingRequest {
    /**
     * Send a 2xx positive final response to this request. Defaults to 200.
     * @param options Response options bucket.
     * @returns Outgoing response and a confirmed Session.
     */
    accept(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * Send a 1xx provisional response to this request. Defaults to 180. Excludes 100.
     * @param options Response options bucket.
     * @returns Outgoing response and an early Session.
     */
    progress(options?: ResponseOptions): OutgoingResponseWithSession;
}
/** Response received when accepting an incoming INVITE request. */
export interface OutgoingResponseWithSession extends OutgoingResponse {
    /** Session associated with incoming request acceptance. */
    readonly session: Session;
}
/** Response received when progressing an incoming INVITE request. */
export interface OutgoingResponseWithSession extends OutgoingResponse {
    /** Session associated with incoming request progress. If out of dialog request, an early dialog. */
    readonly session: Session;
}
/** INVITE message sent from local client to remote server. */
export interface OutgoingInviteRequest extends OutgoingRequest {
    /** Delegate providing custom handling of this outgoing INVITE request. */
    delegate?: OutgoingInviteRequestDelegate;
}
/** Delegate providing custom handling of outgoing INVITE requests. */
export interface OutgoingInviteRequestDelegate extends OutgoingRequestDelegate {
    /**
     * Received a 2xx positive final response to this request.
     * @param response Incoming response (including a confirmed Session).
     */
    onAccept?(response: AckableIncomingResponseWithSession): void;
    /**
     * Received a 1xx provisional response to this request. Excluding 100 responses.
     * @param response Incoming response (including an early Session).
     */
    onProgress?(response: PrackableIncomingResponseWithSession): void;
}
/** Response received when an outgoing INVITE request is accepted. */
export interface AckableIncomingResponseWithSession extends IncomingResponse {
    /** Session associated with outgoing request acceptance. */
    readonly session: Session;
    /**
     * Send an ACK to acknowledge this response.
     * @param options Request options bucket.
     */
    ack(options?: RequestOptions): OutgoingAckRequest;
}
/** Response received when an outgoing INVITE request is progressed. */
export interface PrackableIncomingResponseWithSession extends IncomingResponse {
    /** Session associated with outgoing request progress. If out of dialog request, an early dialog. */
    readonly session: Session;
    /**
     * Send an PRACK to acknowledge this response.
     * @param options Request options bucket.
     */
    prack(options?: RequestOptions): OutgoingPrackRequest;
}
