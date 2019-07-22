import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming INFO request.
 * @public
 */
export interface IncomingInfoRequest extends IncomingRequest {
}

/**
 * Incoming INFO response.
 * @public
 */
export interface IncomingInfoResponse extends IncomingResponse {
}

/**
 * Outgoing INFO request.
 * @public
 */
export interface OutgoingInfoRequest extends OutgoingRequest {
}
