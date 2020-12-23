import { Session } from "./session";
import { SessionDescriptionHandler } from "./session-description-handler";
/**
 * Factory for {@link SessionDescriptionHandler}.
 * @public
 */
export interface SessionDescriptionHandlerFactory {
    /**
     * SessionDescriptionHandler factory function.
     * @remarks
     * The `options` are provided as part of the UserAgent configuration
     * and passed through on every call to SessionDescriptionHandlerFactory's constructor.
     */
    (session: Session, options?: object): SessionDescriptionHandler;
}
//# sourceMappingURL=session-description-handler-factory.d.ts.map