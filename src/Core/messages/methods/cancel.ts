import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

export interface IncomingCancelRequest extends IncomingRequest {
}

export interface IncomingCancelResponse extends IncomingResponse {
}

export interface OutgoingCancelRequest extends OutgoingRequest {
}
