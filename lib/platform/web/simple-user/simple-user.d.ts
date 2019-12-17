import { InvitationAcceptOptions, InviterInviteOptions, InviterOptions, RegistererOptions, RegistererRegisterOptions, RegistererUnregisterOptions } from "../../../api";
import { SimpleUserDelegate } from "./simple-user-delegate";
import { SimpleUserOptions } from "./simple-user-options";
/**
 * A simple SIP user class.
 * @remarks
 * While this class is completely functional for simple use cases, it is not intended
 * to provide an interface which is suitable for most (must less all) applications.
 * While this class has many limitations (for example, it only handles a single concurrent session),
 * it is, however, intended to serve as a simple example of using the SIP.js API.
 * @public
 */
export declare class SimpleUser {
    /** Delegate. */
    delegate: SimpleUserDelegate | undefined;
    private attemptingReconnection;
    private connectRequested;
    private logger;
    private held;
    private options;
    private registerer;
    private registerRequested;
    private session;
    private userAgent;
    /**
     * Constructs a new instance of the `SimpleUser` class.
     * @param server - SIP WebSocket Server URL.
     * @param options - Options bucket. See {@link SimpleUserOptions} for details.
     */
    constructor(server: string, options?: SimpleUserOptions);
    /**
     * Instance identifier.
     * @internal
     */
    readonly id: string;
    /** The local audio track, if available. */
    readonly localAudioTrack: MediaStreamTrack | undefined;
    /** The local video track, if available. */
    readonly localVideoTrack: MediaStreamTrack | undefined;
    /** The remote audio track, if available. */
    readonly remoteAudioTrack: MediaStreamTrack | undefined;
    /** The remote video track, if available. */
    readonly remoteVideoTrack: MediaStreamTrack | undefined;
    /**
     * Connect.
     * @remarks
     * Start the UserAgent's WebSocket Transport.
     */
    connect(): Promise<void>;
    /**
     * Disconnect.
     * @remarks
     * Stop the UserAgent's WebSocket Transport.
     */
    disconnect(): Promise<void>;
    /**
     * Return true if connected.
     */
    isConnected(): boolean;
    /**
     * Start receiving incoming calls.
     * @remarks
     * Send a REGISTER request for the UserAgent's AOR.
     * Resolves when the REGISTER request is sent, otherwise rejects.
     */
    register(registererOptions?: RegistererOptions, registererRegisterOptions?: RegistererRegisterOptions): Promise<void>;
    /**
     * Stop receiving incoming calls.
     * @remarks
     * Send an un-REGISTER request for the UserAgent's AOR.
     * Resolves when the un-REGISTER request is sent, otherwise rejects.
     */
    unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void>;
    /**
     * Make an outoing call.
     * @remarks
     * Send an INVITE request to create a new Session.
     * Resolves when the INVITE request is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if Session is established.
     * @param destination - The target destination to call. A SIP address to send the INVITE to.
     */
    call(destination: string, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<void>;
    /**
     * Hangup a call.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallTerminated` delegate method to determine if and when call is ended.
     */
    hangup(): Promise<void>;
    /**
     * Answer an incoming call.
     * @remarks
     * Accept an incoming INVITE request creating a new Session.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallAnswered` delegate method to determine if and when call is established.
     */
    answer(invitationAcceptOptions?: InvitationAcceptOptions): Promise<void>;
    /**
     * Decline an incoming call.
     * @remarks
     * Reject an incoming INVITE request.
     * Resolves with the response is sent, otherwise rejects.
     * Use `onCallTerminated` delegate method to determine if and when call is ended.
     */
    decline(): Promise<void>;
    /**
     * Hold call
     * @remarks
     * Send a re-INVITE with new offer indicating "hold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    hold(): Promise<void>;
    /**
     * Unhold call.
     * @remarks
     * Send a re-INVITE with new offer indicating "unhold".
     * Resolves when the re-INVITE request is sent, otherwise rejects.
     * Use `onCallHold` delegate method to determine if request is accepted or rejected.
     * See: https://tools.ietf.org/html/rfc6337
     */
    unhold(): Promise<void>;
    /**
     * Hold state.
     * @remarks
     * True if session media is on hold.
     */
    isHeld(): boolean;
    /**
     * Mute call.
     * @remarks
     * Disable sender's media tracks.
     */
    mute(): void;
    /**
     * Unmute call.
     * @remarks
     * Enable sender's media tracks.
     */
    unmute(): void;
    /**
     * Mute state.
     * @remarks
     * True if sender's media track is disabled.
     */
    isMuted(): boolean;
    /**
     * Send DTMF.
     * @remarks
     * Send an INFO request with content type application/dtmf-relay.
     * @param tone - Tone to send.
     */
    sendDTMF(tone: string): Promise<void>;
    /**
     * Send a message.
     * @remarks
     * Send a MESSAGE request.
     * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
     */
    message(destination: string, message: string): Promise<void>;
    /** Media constraints. */
    private readonly constraints;
    /**
     * Attempt reconnection up to `maxReconnectionAttempts` times.
     * @param reconnectionAttempt - Current attempt number.
     */
    private attemptReconnection;
    /** Helper function to remove media from html elements. */
    private cleanupMedia;
    /** Helper function to enable/disable media tracks. */
    private enableSenderTracks;
    /** The receiver media track, if available. */
    private getReceiverTrack;
    /** The sender media track, if available. */
    private getSenderTrack;
    /**
     * Setup session delegate and state change handler.
     * @param session - Session to setup
     * @param referralInviterOptions - Options for any Inviter created as result of a REFER.
     */
    private initSession;
    /** Helper function to init send then send invite. */
    private sendInvite;
    /**
     * Puts Session on hold.
     * @param hold - Hold on if true, off if false.
     */
    private setHold;
    /**
     * Puts Session on mute.
     * @param mute - Mute on if true, off if false.
     */
    private setMute;
    /** Helper function to attach local media to html elements. */
    private setupLocalMedia;
    /** Helper function to attach remote media to html elements. */
    private setupRemoteMedia;
    /**
     * End a session.
     * @remarks
     * Send a BYE request, CANCEL request or reject response to end the current Session.
     * Resolves when the request/response is sent, otherwise rejects.
     * Use `onCallTerminated` delegate method to determine if and when Session is terminated.
     */
    private terminate;
}
//# sourceMappingURL=simple-user.d.ts.map