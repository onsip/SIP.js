import { OutgoingRequestDelegate, RequestOptions } from "../core";

// tslint:disable:no-empty-interface
/**
 * Options for {@link Registerer.register}.
 * @public
 */
export interface RegistererRegisterOptions {
  /** See `core` API. */
  requestDelegate?: OutgoingRequestDelegate;
  /** See `core` API. */
  requestOptions?: RequestOptions;
}
