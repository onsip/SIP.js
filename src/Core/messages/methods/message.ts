import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest } from "../outgoing-request";

// tslint:disable:no-empty-interface

export interface IncomingMessageRequest extends IncomingRequest {
}

export interface IncomingMessageResponse extends IncomingResponse {
}

export interface OutgoingMessageRequest extends OutgoingRequest {
}
