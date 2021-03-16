import { OutgoingRequestDelegate, RequestOptions } from "../core";
/**
 * Options for {@link Registerer.unregister}.
 * @public
 */
export interface RegistererUnregisterOptions {
    /**
     * If true, unregister all contacts.
     * @defaultValue false
     */
    all?: boolean;
    /** See `core` API. */
    requestDelegate?: OutgoingRequestDelegate;
    /** See `core` API. */
    requestOptions?: RequestOptions;
}
//# sourceMappingURL=registerer-unregister-options.d.ts.map