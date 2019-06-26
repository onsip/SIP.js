/**
 * Options for {@link Subscriber} constructor.
 * @public
 */
export interface SubscriberOptions {
  expires?: number;
  extraHeaders?: Array<string>;
  body?: string;
  contentType?: string;
}
