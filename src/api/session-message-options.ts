import { OutgoingRequestDelegate, RequestOptions } from "../core";

/**
 * Options for {@link Session.message}.
 * @public
 */
export interface SessionMessageOptions {
  /** See `core` API. */
  requestDelegate?: OutgoingRequestDelegate;
  /** See `core` API. */
  requestOptions?: RequestOptions;
}
