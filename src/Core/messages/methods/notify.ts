import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

export interface IncomingNotifyRequest extends IncomingRequest {
}

export interface IncomingNotifyResponse extends IncomingResponse {
}

export interface OutgoingNotifyRequest extends OutgoingRequest {
}
