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
    RTCOfferOptions?: any;
    constraints?: MediaStreamConstraints;
}
//# sourceMappingURL=session-description-handler-options.d.ts.map