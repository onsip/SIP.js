import { SessionDescriptionHandler } from "./session-description-handler";
import { SessionDescriptionHandlerOptions } from "./session-description-handler-options";

/**
 * Interface of factory function which produces a MediaStream.
 * @public
 */
export type MediaStreamFactory = (
  constraints: MediaStreamConstraints,
  sessionDescriptionHandler: SessionDescriptionHandler,
  options?: SessionDescriptionHandlerOptions
) => Promise<MediaStream>;
