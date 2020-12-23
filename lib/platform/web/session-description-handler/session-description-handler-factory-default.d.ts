import { SessionDescriptionHandler } from "./session-description-handler";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
/**
 * Function which returns a SessionDescriptionHandlerFactory.
 * @remarks
 * See {@link defaultPeerConnectionConfiguration} for the default peer connection configuration.
 * The ICE gathering timeout defaults to 5000ms.
 * @param mediaStreamFactory - MediaStream factory.
 * @public
 */
export declare function defaultSessionDescriptionHandlerFactory(mediaStreamFactory?: (constraints: MediaStreamConstraints, sessionDescriptionHandler: SessionDescriptionHandler) => Promise<MediaStream>): SessionDescriptionHandlerFactory;
//# sourceMappingURL=session-description-handler-factory-default.d.ts.map