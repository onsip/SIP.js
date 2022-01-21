import { URI } from "../core";
/**
 * Options for {@link Messager} constructor.
 * @public
 */
export interface MessagerOptions {
    /** Array of extra headers added to the MESSAGE. */
    extraHeaders?: Array<string>;
    /** @deprecated TODO: provide alternative. */
    params?: {
        fromDisplayName?: string;
        fromTag?: string;
        fromUri?: string | URI;
        toDisplayName?: string;
        toUri?: string | URI;
    };
}
//# sourceMappingURL=messager-options.d.ts.map