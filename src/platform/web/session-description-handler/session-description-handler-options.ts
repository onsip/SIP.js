import { SessionDescriptionHandlerOptions as SessionDescriptionHandlerOptionsDefinition } from "../../../api";
import { PeerConnectionOptions } from "./peer-connection-options";

/**
 * Options for {@link SessionDescriptionHandler}.
 * @public
 */
export interface SessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptionsDefinition {
  peerConnectionOptions?: PeerConnectionOptions;
  alwaysAcquireMediaFirst?: boolean;
  disableAudioFallback?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RTCOfferOptions?: any;
  constraints?: MediaStreamConstraints;
}
