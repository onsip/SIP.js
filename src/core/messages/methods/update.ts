/* eslint-disable @typescript-eslint/no-empty-interface */
import { IncomingRequest } from "../incoming-request.js";
import { IncomingResponse } from "../incoming-response.js";
import { OutgoingRequest } from "../outgoing-request.js";

/**
 * Incoming UPDATE request.
 * @public
 */
export interface IncomingUpdateRequest extends IncomingRequest {}

/**
 * Incoming UPDATE response.
 * @public
 */
export interface IncomingUpdateResponse extends IncomingResponse {}

/**
 * Outgoing UPDATE request.
 * @public
 */
export interface OutgoingUpdateRequest extends OutgoingRequest {}
