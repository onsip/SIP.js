// tslint:disable:callable-types

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
   * @returns {Promise} Promise that resolves with the local description to be used for the session
   */
  getDescription(
    options?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  ): Promise<BodyObj>;

  /**
   * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
   * @param {String} contentType The content type that is in the SIP Message
   * @returns {boolean}
   */
  hasDescription(contentType: string): boolean;

  /**
   * The modifier that should be used when the session would like to place the call on hold
   * @param {String} [sdp] The description that will be modified
   * @returns {Promise} Promise that resolves with modified SDP
   */
  holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;

  /**
   * Set the remote description to the underlying media implementation
   * @param {String} sessionDescription The description provided by a SIP message to be set on the media implementation
   * @param {Object} [options] Options object to be used by setDescription
   * @param {Array} [modifiers] Array with one time use description modifiers
   * @returns {Promise} Promise that resolves once the description is set
   */
  setDescription(
    sdp: string,
    options?: SessionDescriptionHandlerOptions,
    modifiers?: SessionDescriptionHandlerModifiers
  ): Promise<void>;

  /**
   * Send DTMF via RTP (RFC 4733)
   * @param {String} tones A string containing DTMF digits
   * @param {Object} [options] Options object to be used by sendDtmf
   * @returns {boolean} true if DTMF send is successful, false otherwise
   */
  sendDtmf(tones: string, options?: any): boolean;
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
export interface SessionDescriptionHandlerOptions {
  modifiers?: SessionDescriptionHandlerModifiers;
  constraints?: { audio: boolean, video: boolean };
}

/**
 * SIP message body and content type.
 */
export interface BodyObj {
  body: string;
  contentType: string;
}
