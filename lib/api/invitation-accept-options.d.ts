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
}
//# sourceMappingURL=invitation-accept-options.d.ts.map