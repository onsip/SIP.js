import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming REFER request.
 * @public
 */
export interface IncomingReferRequest extends IncomingRequest {
}

/**
 * Incoming REFER response.
 * @public
 */
export interface IncomingReferResponse extends IncomingResponse {
}

/**
 * Outgoing REFER request.
 * @public
 */
export interface OutgoingReferRequest extends OutgoingRequest {
}
