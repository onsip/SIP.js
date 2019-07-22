import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming PUBLISH request.
 * @public
 */
export interface IncomingPublishRequest extends IncomingRequest {
}

/**
 * Incoming PUBLISH response.
 * @public
 */
export interface IncomingPublishResponse extends IncomingResponse {
}

/**
 * Outgoing PUBLISH request.
 * @public
 */
export interface OutgoingPublishRequest extends OutgoingRequest {
}
