import { IncomingRequestMessage } from "../core";
import { SessionDescriptionHandlerModifier, SessionDescriptionHandlerOptions } from "./session-description-handler";
/**
 * Options for {@link Invitation.accept}.
 * @public
 */
export interface InvitationAcceptOptions {
    /**
     * Options to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
    /**
     * Modifiers to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    /**
     * @deprecated Use delegate instead.
     * @internal
     */
    onInfo?: ((request: IncomingRequestMessage) => void);
}
//# sourceMappingURL=invitation-accept-options.d.ts.map