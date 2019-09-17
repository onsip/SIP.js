/**
 * Options for {@link Registerer} constructor.
 * @public
 */
export interface RegistererOptions {
  expires?: number;
  extraContactHeaderParams?: Array<string>;
  /** Array of extra headers added to the REGISTER. */
  extraHeaders?: Array<string>;
  instanceId?: string;
  params?: any;
  regId?: number;
  registrar?: string;
}
