
/**
 * The SessionDescriptionHandler interface SIP.js is expecting.
 */
export interface SessionDescriptionHandler {
  /**
   * Destructor
   */
  close(): void;

  /**
   * Gets the local description from the underlying media implementation.
   * @param options Options object to be used by getDescription.
   * @param modifiers Array with one time use description modifiers.
   */
  getDescription(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<{ body: string; contentType: string }>;

  /**
   * True if the Session Description Handler can handle the Content-Type described by a SIP Message.
   * @param contentType The content type that is in the SIP Message.
   */
  hasDescription(contentType: string): boolean;

  /**
   * The modifier which should be used when the session would like to place the call on hold.
   * @param sessionDescription The description that will be modified.
   */
  holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;

  /**
   * Set the remote description to the underlying media implementation.
   * @param sdp The description provided by a SIP message to be set on the media implementation.
   * @param options Options object to be used by setDescription.
   * @param modifiers Array with one time use description modifiers.
   */
  setDescription(sdp: string, options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<void>;
}

export interface SessionDescriptionHandlerModifier {
  (sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
}

export type SessionDescriptionHandlerModifiers = Array<SessionDescriptionHandlerModifier>;

/**
 * SessionDescriptionHandler options.
 * These options are provided to various UserAgent methods (invite() for example)
 * and passed through on calls to getDescription() and setDescription().
 */
export type SessionDescriptionHandlerOptions = object;
