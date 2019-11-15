import { SubscriptionOptions } from "./subscription-options";
/**
 * Options for {@link Subscriber} constructor.
 * @public
 */
export interface SubscriberOptions extends SubscriptionOptions {
    expires?: number;
    extraHeaders?: Array<string>;
    body?: string;
    contentType?: string;
}
//# sourceMappingURL=subscriber-options.d.ts.map