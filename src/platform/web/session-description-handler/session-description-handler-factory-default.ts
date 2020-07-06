import { Session } from "../../../api";
import { defaultMediaStreamFactory } from "./media-stream-factory-default";
import { defaultPeerConnectionConfiguration } from "./peer-connection-configuration-default";
import { SessionDescriptionHandler } from "./session-description-handler";
import { SessionDescriptionHandlerConfiguration } from "./session-description-handler-configuration";
import { SessionDescriptionHandlerFactory } from "./session-description-handler-factory";
import { SessionDescriptionHandlerFactoryOptions } from "./session-description-handler-factory-options";

/**
 * Function which returns a SessionDescriptionHandlerFactory.
 * @remarks
 * See {@link defaultPeerConnectionConfiguration} for the default peer connection configuration.
 * The ICE gathering timeout defaults to 5000ms.
 * @param mediaStreamFactory - MediaStream factory.
 * @public
 */
export function defaultSessionDescriptionHandlerFactory(
  mediaStreamFactory?: (
    constraints: MediaStreamConstraints,
    sessionDescriptionHandler: SessionDescriptionHandler
  ) => Promise<MediaStream>
): SessionDescriptionHandlerFactory {
  return (session: Session, options?: SessionDescriptionHandlerFactoryOptions): SessionDescriptionHandler => {
    // provide a default media stream factory if need be
    if (mediaStreamFactory === undefined) {
      mediaStreamFactory = defaultMediaStreamFactory();
    }

    // make sure we allow `0` to be passed in so timeout can be disabled
    const iceGatheringTimeout = options?.iceGatheringTimeout !== undefined ? options?.iceGatheringTimeout : 5000;

    // merge passed factory options into default session description configuration
    const sessionDescriptionHandlerConfiguration: SessionDescriptionHandlerConfiguration = {
      iceGatheringTimeout,
      peerConnectionConfiguration: {
        ...defaultPeerConnectionConfiguration(),
        ...options?.peerConnectionConfiguration
      }
    };

    const logger = session.userAgent.getLogger("sip.SessionDescriptionHandler");

    return new SessionDescriptionHandler(logger, mediaStreamFactory, sessionDescriptionHandlerConfiguration);
  };
}
