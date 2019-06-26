import { C } from "../Constants";

import {
  DigestAuthentication,
  Transport,
  URI
} from "../core";
import { RegistererOptions } from "./registerer-options";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { UserAgent } from "./user-agent";
import { UserAgentDelegate } from "./user-agent-delegate";

/**
 * DTMF signaling delivery method.
 * @internal
 */
export enum DTMFSignaling {
  RTP = "RTP",
  INFO = "INFO"
}

/**
 * Options for {@link UserAgent} constructor.
 * @public
 */
export interface UserAgentOptions {
  allowLegacyNotifications?: boolean;
  allowOutOfDialogRefers?: boolean;
  authenticationFactory?: (ua: UserAgent) => DigestAuthentication | any; // any for custom ones
  authorizationUser?: string;

  // authorizationPassword?: string;
  // authorizationUsername?: string;

  /**
   * If `true`, the user agent calls the `start()` method upon being created.
   * @defaultValue `true`
   */
  autostart?: boolean;
  // autoStart?: boolean;

  /**
   * If `true`, stop on unload (if running in browser window).
   * @defaultValue `true`
   */
  autostop?: boolean;
  // autoStop?: boolean;

  /**
   * Delegate for {@link UserAgent}.
   */
  delegate?: UserAgentDelegate;

  /**
   * The display name associated with the user agent.
   * @remarks
   * Descriptive name to be shown to the called party when calling or sending IM messages
   * (the display name portion of the From header).
   * It must NOT be enclosed between double quotes even if the given name contains multi-byte symbols
   * (SIPjs will always enclose the `displayName` value between double quotes).
   */
  displayName?: string;

  /**
   * DTMF signaling type.
   * @remarks
   * RTP Payload Spec: https://tools.ietf.org/html/rfc4733
   * WebRTC Audio Spec: https://tools.ietf.org/html/rfc7874
   */
  dtmfSignaling?: DTMFSignaling;

  experimentalFeatures?: boolean;
  extraSupported?: Array<string>;
  forceRport?: boolean;
  hackIpInContact?: boolean;
  hackAllowUnregisteredOptionTags?: boolean;
  hackViaTcp?: boolean;
  hackWssInTransport?: boolean;
  hostportParams?: any;
  log?: {
    builtinEnabled: boolean,
    level: string | number,
    connector: (level: string, category: string, label: string | undefined, content: any) => void,
  };

  /**
   * Time (in seconds) after which an incoming call is rejected if not answered.
   * @defaultValue 60
   */
  noAnswerTimeout?: number;

  password?: string;

  /**
   * Indicate if the user agent should register automatically when starting.
   * @defaultValue `true`
   */
  register?: boolean;

  /**
   * See {@link RegistererOptions}.
   */
  registerOptions?: RegistererOptions;

  rel100?: C.supported;
  replaces?: C.supported;
  sessionDescriptionHandlerFactory?: SessionDescriptionHandlerFactory;
  sessionDescriptionHandlerFactoryOptions?: object;
  sipjsId?: string;

  /**
   * The constructor for an object to be used as the transport layer for the user agent.
   * @remarks
   * For more information about creating your own transport see `Transport`.
   * @defaultValue `WebSocketTransport`
   */
  transportConstructor?: new (logger: any, options: any) => Transport;

  /**
   * An options bucket object passed to `transportConstructor` when instantiated.
   * @remarks
   * See WebSocket Transport Configuration Parameters for the full list of options for the default transport.
   * @defaultValue `{}`
   */
  transportOptions?: any;

  /**
   * SIP URI associated with the user agent.
   * @remarks
   * This is a SIP address given to you by your provider.
   * @defaultValue
   * By default, URI is set to `anonymous.X@anonymous.invalid`, where X is a random token generated for each UA.
   */
  uri?: string | URI;

  usePreloadedRoute?: boolean;
  userAgentString?: string;
  viaHost?: string;
}
