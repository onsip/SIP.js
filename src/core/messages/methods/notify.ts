import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming NOTIFY request.
 * @public
 */
export interface IncomingNotifyRequest extends IncomingRequest {
}

/**
 * Incoming NOTIFY response.
 * @public
 */
export interface IncomingNotifyResponse extends IncomingResponse {
}

/**
 * Outgoing NOTIFY request.
 * @public
 */
export interface OutgoingNotifyRequest extends OutgoingRequest {
}
