import { InvitationAcceptOptions, InviterInviteOptions, InviterOptions, RegistererOptions, RegistererRegisterOptions, RegistererUnregisterOptions } from "../../api";
import { SimpleUserDelegate } from "./simple-user-delegate";
import { SimpleUserOptions } from "./simple-user-options";
/**
 * A Simple SIP User class.
 * @remarks
 * While this class is completely functional for simple use cases, it is not intended
 * to provide an interface which is suitable for most (must less all) applications.
 * While this class has many limitations (for example, it only handles a single concurrent session),
 * it is, however, intended to serve as a simple example of using the SIP.js API.
 */
export declare class SimpleUser {
    /** Delegate. */
    delegate: SimpleUserDelegate | undefined;
    private logger;
    private options;
    private registerer;
    private session;
    private userAgent;
    /**
     * Constructs a new instance of the `SimpleUser` class.
     * @param webSocketServerURL - SIP WebSocket Server URL.
     * @param options - Options bucket. See {@link SimpleUserOptions} for details.
     */
    constructor(webSocketServerURL: string, options?: SimpleUserOptions);
    /** Instance identifier. */
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
     * Start the UserAgent's WebSocket Transport.
     */
    connect(): Promise<void>;
    /**
     * Disconnect.
     * Stop the UserAgent's WebSocket Transport.
     */
    disconnect(): Promise<void>;
    /**
     * Start receiving incoming calls.
     * Send a REGISTER request for the UserAgent's AOR.
     */
    register(registererOptions?: RegistererOptions, registererRegisterOptions?: RegistererRegisterOptions): Promise<void>;
    /**
     * Stop receiving incoming calls.
     * Send an un-REGISTER request for the UserAgent's AOR.
     */
    unregister(registererUnregisterOptions?: RegistererUnregisterOptions): Promise<void>;
    /**
     * Make an outoing call.
     * Send an INVITE request to create a new Session.
     * @param destination - The target destination to call. A SIP address to send the INVITE to.
     */
    call(destination: string, inviterOptions?: InviterOptions, inviterInviteOptions?: InviterInviteOptions): Promise<void>;
    /**
     * Hangup a call.
     * Send a BYE request to end the current Session.
     */
    hangup(): Promise<void>;
    /**
     * Answer an incoming call.
     * Accept an incoming INVITE request creating a new Session.
     */
    answer(invitationAcceptOptions?: InvitationAcceptOptions): Promise<void>;
    /**
     * Decline an incoming call.
     * Reject an incoming INVITE request.
     */
    decline(): Promise<void>;
    /**
     * Hold call.
     * Send a re-INVITE with new offer indicating "hold".
     * See: https://tools.ietf.org/html/rfc6337
     */
    hold(): Promise<void>;
    /**
     * Unhold call.
     * Send a re-INVITE with new offer indicating "unhold".
     * See: https://tools.ietf.org/html/rfc6337
     */
    unhold(): Promise<void>;
    /**
     * Mute call.
     * Disable sender's media tracks.
     */
    mute(): void;
    /**
     * Unmute call.
     * Enable sender's media tracks.
     */
    unmute(): void;
    /**
     * Mute state.
     * True if sender's media track is disabled.
     */
    isMuted(): boolean;
    /**
     * Send DTMF.
     * Send an INFO request with content type application/dtmf-relay.
     * @param tone - Tone to send.
     */
    sendDTMF(tone: string): Promise<void>;
    /**
     * Send a message.
     * Send a MESSAGE request.
     * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
     */
    message(destination: string, message: string): Promise<void>;
    /** Media constraints. */
    private readonly constraints;
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
    /** Helper function to attach local media to html elements. */
    private setupLocalMedia;
    /** Helper function to attach remote media to html elements. */
    private setupRemoteMedia;
    /** Helper function to remove media from html elements. */
    private cleanupMedia;
}
//# sourceMappingURL=simple-user.d.ts.map