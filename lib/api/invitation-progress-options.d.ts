import { SessionDescriptionHandlerModifier, SessionDescriptionHandlerOptions } from "./session-description-handler";
/**
 * Options for {@link Invitation.progress}.
 * @public
 */
export interface InvitationProgressOptions {
    /**
     * Body
     */
    body?: string | {
        body: string;
        contentType: string;
    };
    /**
     * Array of extra headers added to the response.
     */
    extraHeaders?: Array<string>;
    /**
     * Options to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
    /**
     * Modifiers to pass to SessionDescriptionHandler's getDescription() and setDescription().
     */
    sessionDescriptionHandlerModifiers?: Array<SessionDescriptionHandlerModifier>;
    /**
     * Status code for response.
     */
    statusCode?: number;
    /**
     * Reason phrase for response.
     */
    reasonPhrase?: string;
    /**
     * Send reliable response.
     */
    rel100?: boolean;
}
//# sourceMappingURL=invitation-progress-options.d.ts.map