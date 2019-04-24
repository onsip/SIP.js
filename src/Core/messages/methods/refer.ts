import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest, OutgoingRequestDelegate } from "../outgoing-request";

// tslint:disable:no-empty-interface

export interface IncomingReferRequest extends IncomingRequest {
}

export interface IncomingReferResponse extends IncomingResponse {
}

export interface OutgoingReferRequest extends OutgoingRequest {
}
