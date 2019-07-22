import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming PRACK request.
 * @public
 */
export interface IncomingPrackRequest extends IncomingRequest {
}

/**
 * Incoming PRACK response.
 * @public
 */
export interface IncomingPrackResponse extends IncomingResponse {
}

/**
 * Outgoing PRACK request.
 * @public
 */
export interface OutgoingPrackRequest extends OutgoingRequest {
}
