import { Subscription } from "../../subscription";
import { IncomingRequest } from "../incoming-request";
import { IncomingResponse } from "../incoming-response";
import { OutgoingRequest, OutgoingRequestDelegate } from "../outgoing-request";

// tslint:disable:no-empty-interface

export interface IncomingSubscribeRequest extends IncomingRequest {
}

export interface IncomingSubscribeResponse extends IncomingResponse {
}

/** SUBSCRIBE message sent from local client to remote server. */
export interface OutgoingSubscribeRequest extends OutgoingRequest {
  /** Delegate providing custom handling of this outgoing SUBSCRIBE request. */
  delegate?: OutgoingSubscribeRequestDelegate;
}

/** Delegate providing custom handling of outgoing SUBSCRIBE requests. */
export interface OutgoingSubscribeRequestDelegate extends OutgoingRequestDelegate {
  /**
   * Received a 2xx positive final response to this request.
   * @param response Incoming response (including a Subscription).
   */
  onAccept?(incomingResponse: SubscribeAcceptIncomingResponse): void;
}

/** Response received when an outgoing SUBSCRIBE request is accepted. */
export interface SubscribeAcceptIncomingResponse extends IncomingResponse {
  /** Subscription created when an outgoing SUBSCRIBE request is accepted. */
  readonly subscription: Subscription;
}
