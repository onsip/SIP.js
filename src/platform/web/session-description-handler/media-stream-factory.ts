import { SessionDescriptionHandler } from "./session-description-handler";

/**
 * Interface of factory function which produces a MediaStream.
 * @public
 */
export type MediaStreamFactory = (
  constraints: MediaStreamConstraints,
  mediaStream?: MediaStream,
  sessionDescriptionHandler?: SessionDescriptionHandler
) => Promise<MediaStream>;
