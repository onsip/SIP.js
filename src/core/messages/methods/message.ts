import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming MESSAGE request.
 * @public
 */
export interface IncomingMessageRequest extends IncomingRequest {
}

/**
 * Incoming MESSAGE response.
 * @public
 */
export interface IncomingMessageResponse extends IncomingResponse {
}

/**
 * Outgoing MESSAGE request.
 * @public
 */
export interface OutgoingMessageRequest extends OutgoingRequest {
}
