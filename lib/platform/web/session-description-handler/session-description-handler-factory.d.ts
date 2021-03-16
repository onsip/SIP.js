import { Session, SessionDescriptionHandlerFactory as SessionDescriptionHandlerFactoryDefinition } from "../../../api";
import { SessionDescriptionHandler } from "./session-description-handler";
import { SessionDescriptionHandlerFactoryOptions } from "./session-description-handler-factory-options";
/**
 * Factory for {@link SessionDescriptionHandler}.
 * @public
 */
export interface SessionDescriptionHandlerFactory extends SessionDescriptionHandlerFactoryDefinition {
    /**
     * SessionDescriptionHandler factory function.
     * @remarks
     * The `options` are provided as part of the UserAgent configuration
     * and passed through on every call to SessionDescriptionHandlerFactory's constructor.
     */
    (session: Session, options?: SessionDescriptionHandlerFactoryOptions): SessionDescriptionHandler;
}
//# sourceMappingURL=session-description-handler-factory.d.ts.map