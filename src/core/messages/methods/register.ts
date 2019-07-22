import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

/**
 * Incoming REGISTER request.
 * @public
 */
export interface IncomingRegisterRequest extends IncomingRequest {
}

/**
 * Incoming REGISTER response.
 * @public
 */
export interface IncomingRegisterResponse extends IncomingResponse {
}

/**
 * Outgoing REGISTER request.
 * @public
 */
export interface OutgoingRegisterRequest extends OutgoingRequest {
}
