import { Exceptions } from "../../Exceptions";
import { IncomingRequest as IncomingRequestMessage } from "../../SIPMessage";
import { URI } from "../../URI";
import { OutgoingResponse, ResponseOptions } from "./outgoing-response";

/**
 * A SIP message sent from a remote client to a local server,
 * for the purpose of invoking a particular operation.
 * https://tools.ietf.org/html/rfc3261#section-7.1
 */
export interface IncomingRequest {
  /** Delegate providing custom handling of this incoming request. */
  delegate?: IncomingRequestDelegate;
  /** The incoming message. */
  readonly message: IncomingRequestMessage;

  /**
   * Send a 2xx positive final response to this request. Defaults to 200.
   * @param options Response options bucket.
   */
  accept(options?: ResponseOptions): OutgoingResponse;

  /**
   * Send a 1xx provisional response to this request. Defaults to 180. Excludes 100.
   * @param options Response options bucket.
   */
  progress(options?: ResponseOptions): OutgoingResponse;

  /**
   * Send a 3xx negative final response to this request. Defaults to 302.
   * @param contacts Contacts to redirect the UAC to.
   * @param options Response options bucket.
   */
  redirect(contacts: Array<URI>, options?: ResponseOptions): OutgoingResponse;

  /**
   * Send a 4xx, 5xx, or 6xx negative final response to this request. Defaults to 480.
   * @param options Response options bucket.
   */
  reject(options?: ResponseOptions): OutgoingResponse;

  /**
   * Send a 100 outgoing response to this request.
   * @param options Response options bucket.
   */
  trying(options?: ResponseOptions): OutgoingResponse;
}

/** Delegate providing custom handling of incoming requests. */
export interface IncomingRequestDelegate {
  /**
   * Receive CANCEL request.
   * https://tools.ietf.org/html/rfc3261#section-9.2
   * Note: Currently CANCEL is being handled as a special case.
   * No UAS is created to handle the CANCEL and the response to
   * it CANCEL is being handled statelessly by the user agent core.
   * As such, there is currently no way to externally impact the
   * response to the a CANCEL request and thus the method here is
   * receiving a "message" (as apposed to a "uas").
   * @param message Incoming CANCEL request message.
   */
  onCancel?(message: IncomingRequestMessage): void;

  /**
   * A transport error occurred attempted to send a response.
   * @param error Transport error.
   */
  onTransportError?(error: Exceptions.TransportError): void;
}
