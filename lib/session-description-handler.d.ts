/**
 * The SessionDescriptionHandler interface SIP.js is expecting.
 */
export interface SessionDescriptionHandler {
    /**
     * Destructor.
     */
    close(): void;
    /**
     * Gets the local description from the underlying media implementation.
     * @param options Options object to be used by getDescription.
     * @param modifiers Array with one time use description modifiers.
     * @returns Promise that resolves with the local description to be used for the session.
     * @throws {ClosedSessionDescriptionHandlerError} When this method
     *         is called after close or when close occurs before complete.
     */
    getDescription(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<BodyObj>;
    /**
     * Returns true if the Session Description Handler can handle the Content-Type described by a SIP message.
     * @param contentType The content type that is in the SIP Message.
     * @returns True if the content type is  handled by this session description handler. False otherwise.
     */
    hasDescription(contentType: string): boolean;
    /**
     * The modifier that should be used when the session would like to place the call on hold.
     * @param sessionDescription The description that will be modified.
     * @returns Promise that resolves with modified SDP.
     * @throws {ClosedSessionDescriptionHandlerError} When this method
     *         is called after close or when close occurs before complete.
     */
    holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Sets the remote description to the underlying media implementation.
     * @param  sessionDescription The description provided by a SIP message to be set on the media implementation.
     * @param options Options object to be used by setDescription.
     * @param modifiers Array with one time use description modifiers.
     * @returns Promise that resolves once the description is set.
     * @throws {ClosedSessionDescriptionHandlerError} When this method
     *         is called after close or when close occurs before complete.
     */
    setDescription(sdp: string, options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<void>;
    /**
     * Send DTMF via RTP (RFC 4733).
     * Returns true if DTMF send is successful, false otherwise.
     * @param tones A string containing DTMF digits.
     * @param options Options object to be used by sendDtmf.
     * @returns True if DTMF send is successful, false otherwise.
     */
    sendDtmf(tones: string, options?: any): boolean;
}
export interface SessionDescriptionHandlerModifier {
    (sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
}
export declare type SessionDescriptionHandlerModifiers = Array<SessionDescriptionHandlerModifier>;
/**
 * SessionDescriptionHandler options.
 * These options are provided to various UserAgent methods (invite() for example)
 * and passed through on calls to getDescription() and setDescription().
 */
export interface SessionDescriptionHandlerOptions {
    modifiers?: SessionDescriptionHandlerModifiers;
    constraints?: object;
}
/**
 * SIP message body and content type.
 */
export interface BodyObj {
    body: string;
    contentType: string;
}
//# sourceMappingURL=session-description-handler.d.ts.map