import { SessionDescriptionHandler } from "./session-description-handler";
/**
 * Interface of factory function which produces a MediaStream.
 * @public
 */
export declare type MediaStreamFactory = (constraints: MediaStreamConstraints, sessionDescriptionHandler: SessionDescriptionHandler) => Promise<MediaStream>;
//# sourceMappingURL=media-stream-factory.d.ts.map