import {
  Byer,
  Infoer,
  Invitation,
  InvitationAcceptOptions,
  Inviter,
  InviterInviteOptions,
  InviterOptions,
  Message,
  Messager,
  Referral,
  Registerer,
  RegistererOptions,
  RegistererRegisterOptions,
  RegistererState,
  RegistererUnregisterOptions,
  Session,
  SessionInviteOptions,
  SessionState,
  UserAgent,
  UserAgentOptions
} from "../../api";
import { Logger } from "../../core";
import { SessionDescriptionHandler } from "./session-description-handler";
import { SimpleUserDelegate } from "./simple-user-delegate";
import { SimpleUserOptions } from "./simple-user-options";
import { Transport } from "./transport";

/**
 * A Simple SIP User class.
 * @remarks
 * While this class is completely functional for simple use cases, it is not intended
 * to provide an interface which is suitable for most (must less all) applications.
 * While this class has many limitations (for example, it only handles a single concurrent session),
 * it is, however, intended to serve as a simple example of using the SIP.js API.
 */
export class SimpleUser {
  /** Delegate. */
  public delegate: SimpleUserDelegate | undefined;

  private logger: Logger;
  private options: SimpleUserOptions;
  private registerer: Registerer | undefined = undefined;
  private session: Session | undefined = undefined;
  private userAgent: UserAgent;

  /**
   * Constructs a new instance of the `SimpleUser` class.
   * @param webSocketServerURL - SIP WebSocket Server URL.
   * @param options - Options bucket. See {@link SimpleUserOptions} for details.
   */
  constructor(webSocketServerURL: string, options: SimpleUserOptions = {}) {
    // Delegate
    this.delegate = options.delegate;

    // Copy options
    this.options = { ...options };

    // UserAgentOptions
    const userAgentOptions: UserAgentOptions = {
      ...options.userAgentOptions
    };

    // Transport
    if  (!userAgentOptions.transportConstructor) {
      userAgentOptions.transportConstructor = Transport;
    }

    // TransportOptions
    if (!userAgentOptions.transportOptions) {
      userAgentOptions.transportOptions = {
        wsServers: webSocketServerURL
      };
    }

    // URI
    if (!userAgentOptions.uri) {
      // If an AOR was provided, convert it to a URI
      if (options.aor) {
        const uri = UserAgent.makeURI(options.aor);
        if (!uri) {
          throw new Error(`Failed to create valid URI from ${options.aor}`);
        }
        userAgentOptions.uri = uri;
      }
    }

    // UserAgent
    this.userAgent = new UserAgent(userAgentOptions);

    // UserAgent's delegate
    this.userAgent.delegate = {
      // Handle incoming invitations
      onInvite: (invitation: Invitation) => {
        this.logger.log(`[${this.id}] received INVITE`);

        // Guard against a pre-existing session. This implementation only supports one session at a time.
        // However an incoming INVITE request may be received at any time and/or while in the process
        // of sending an outgoing INVITE request. So we reject any incoming INVITE in those cases.
        if (this.session) {
          this.logger.warn(`[${this.id}] session already in progress, rejecting INVITE...`);
          invitation.reject()
            .then(() => {
              this.logger.log(`[${this.id}] rejected INVITE`);
            })
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] failed to reject INVITE`);
              this.logger.error(error.toString());
            });
          return;
        }

        // Use our configured constraints as options for any Inviter created as result of a REFER
        const referralInviterOptions: InviterOptions = {
          sessionDescriptionHandlerOptions: { constraints: this.constraints }
        };

        // Initialize our session
        this.initSession(invitation, referralInviterOptions);

        // Delegate
        if (this.delegate && this.delegate.onCallReceived) {
          this.delegate.onCallReceived();
        } else {
          this.logger.warn(`[${this.id}] no handler available, rejecting INVITE...`);
          invitation.reject()
            .then(() => {
              this.logger.log(`[${this.id}] rejected INVITE`);
            })
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] failed to reject INVITE`);
              this.logger.error(error.toString());
            });
        }
      },
      onMessage: (message: Message) => {
        message.accept()
          .then(() => {
            if (this.delegate && this.delegate.onMessageReceived) {
              this.delegate.onMessageReceived(message.request.body);
            }
          });
      }
    };

    // Use the SIP.js logger
    this.logger = this.userAgent.getLogger("sip.SimpleUser");
  }

  /** Instance identifier. */
  get id(): string {
    return (this.options.userAgentOptions && this.options.userAgentOptions.displayName) || "Anonymous";
  }

  /** The local audio track, if available. */
  get localAudioTrack(): MediaStreamTrack | undefined {
    return this.getSenderTrack("audio");
  }

  /** The local video track, if available. */
  get localVideoTrack(): MediaStreamTrack | undefined {
    return this.getSenderTrack("video");
  }

  /** The remote audio track, if available. */
  get remoteAudioTrack(): MediaStreamTrack | undefined {
    return this.getReceiverTrack("audio");
  }

  /** The remote video track, if available. */
  get remoteVideoTrack(): MediaStreamTrack | undefined {
    return this.getReceiverTrack("video");
  }

  /**
   * Connect.
   * Start the UserAgent's WebSocket Transport.
   */
  public connect(): Promise<void> {
    this.logger.log(`[${this.id}] starting UserAgent...`);
    return this.userAgent.start();
  }

  /**
   * Disconnect.
   * Stop the UserAgent's WebSocket Transport.
   */
  public disconnect(): Promise<void> {
    this.logger.log(`[${this.id}] stopping UserAgent...`);
    return this.userAgent.stop();
  }

  /**
   * Start receiving incoming calls.
   * Send a REGISTER request for the UserAgent's AOR.
   */
  public register(
    registererOptions?: RegistererOptions,
    registererRegisterOptions?: RegistererRegisterOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] registering UserAgent...`);

    if (!this.registerer) {
      this.registerer = new Registerer(this.userAgent, registererOptions);
      this.registerer.stateChange.on((state: RegistererState) => {
        switch (state) {
          case RegistererState.Initial:
            break;
          case RegistererState.Registered:
            if (this.delegate && this.delegate.onRegistered) {
              this.delegate.onRegistered();
            }
            break;
          case RegistererState.Unregistered:
            if (this.delegate && this.delegate.onUnregistered) {
              this.delegate.onUnregistered();
            }
            break;
          case RegistererState.Terminated:
            this.registerer = undefined;
            break;
          default:
            throw new Error("Unknown registerer state.");
        }
      });
    }

    return this.registerer.register(registererRegisterOptions)
      .then(() => { return; });
  }

  /**
   * Stop receiving incoming calls.
   * Send an un-REGISTER request for the UserAgent's AOR.
   */
  public unregister(
    registererUnregisterOptions?: RegistererUnregisterOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] unregistering UserAgent...`);

    if (!this.registerer) {
      return Promise.resolve();
    }

    return this.registerer.unregister(registererUnregisterOptions)
      .then(() => { return; });
  }

  /**
   * Make an outoing call.
   * Send an INVITE request to create a new Session.
   * @param destination - The target destination to call. A SIP address to send the INVITE to.
   */
  public call(
    destination: string,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] beginning Session...`);

    if (this.session) {
      return Promise.reject(new Error("Session already exists."));
    }

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }

    // Use our configured constraints as InviterOptions if none provided
    if (!inviterOptions) {
      inviterOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions) {
      inviterOptions.sessionDescriptionHandlerOptions = {};
    }
    if (!inviterOptions.sessionDescriptionHandlerOptions.constraints) {
      inviterOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
    }

    // Create a new Inviter for the outgoing Session
    const inviter = new Inviter(this.userAgent, target, inviterOptions);

    // Send INVITE
    return this.sendInvite(inviter, inviterOptions, inviterInviteOptions)
      .then(() => { return; });
  }

  /**
   * Hangup a call.
   * Send a BYE request to end the current Session.
   */
  public hangup(): Promise<void> {
    this.logger.log(`[${this.id}] ending Session...`);

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    // Attempt to CANCEL outgoing sessions that are not yet established
    if (this.session instanceof Inviter) {
      if (this.session.state === SessionState.Initial || this.session.state === SessionState.Establishing) {
        return this.session.cancel()
          .then(() => {
            this.logger.log(`[${this.id}] sent CANCEL`);
          });
      }
    }

    // Send BYE
    return new Byer(this.session).bye()
      .then(() => {
        this.logger.log(`[${this.id}] sent BYE`);
      });
  }

  /**
   * Answer an incoming call.
   * Accept an incoming INVITE request creating a new Session.
   */
  public answer(
    invitationAcceptOptions?: InvitationAcceptOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] accepting Invitation...`);

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error("Session not instance of Invitation."));
    }

    // Use our configured constraints as InvitationAcceptOptions if none provided
    if (!invitationAcceptOptions) {
      invitationAcceptOptions = {};
    }
    if (!invitationAcceptOptions.sessionDescriptionHandlerOptions) {
      invitationAcceptOptions.sessionDescriptionHandlerOptions = {};
    }
    if (!invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints) {
      invitationAcceptOptions.sessionDescriptionHandlerOptions.constraints = this.constraints;
    }

    return this.session.accept(invitationAcceptOptions);
  }

  /**
   * Decline an incoming call.
   * Reject an incoming INVITE request.
   */
  public decline(): Promise<void> {
    this.logger.log(`[${this.id}] rejecting Invitation...`);

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    if (!(this.session instanceof Invitation)) {
      return Promise.reject(new Error("Session not instance of Invitation."));
    }

    return this.session.reject();
  }

  /**
   * Hold call.
   * Send a re-INVITE with new offer indicating "hold".
   * See: https://tools.ietf.org/html/rfc6337
   */
  public hold(): Promise<void> {
    this.logger.log(`[${this.id}] holding session...`);

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    if (this.session.state !== SessionState.Established) {
      return Promise.reject(new Error("Session is not established."));
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
    }

    const options: SessionInviteOptions = {
      sessionDescriptionHandlerModifiers: [sessionDescriptionHandler.holdModifier]
    };

    // Mute
    this.mute();

    // Send re-INVITE
    return this.session.invite(options)
      .then(() => { return; });
  }

  /**
   * Unhold call.
   * Send a re-INVITE with new offer indicating "unhold".
   * See: https://tools.ietf.org/html/rfc6337
   */
  public unhold(): Promise<void> {
    this.logger.log(`[${this.id}] unholding session...`);

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    if (this.session.state !== SessionState.Established) {
      return Promise.reject(new Error("Session is not established."));
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
    }

    const options: SessionInviteOptions = {};

    // Unmute
    this.unmute();

    // Send re-INVITE
    return this.session.invite(options)
      .then(() => { return; });
  }

  /**
   * Mute call.
   * Disable sender's media tracks.
   */
  public mute(): void {
    this.logger.log(`[${this.id}] disabling media tracks...`);

    if (!this.session) {
      this.logger.warn(`[${this.id}] an session is required to disable media tracks`);
      return;
    }

    if (this.session.state !== SessionState.Established) {
      this.logger.warn(`[${this.id}] an established session is required to disable media tracks`);
      return;
    }

    this.enableSenderTracks(false);
  }

  /**
   * Unmute call.
   * Enable sender's media tracks.
   */
  public unmute(): void {
    this.logger.log(`[${this.id}] enabling media tracks...`);

    if (!this.session) {
      this.logger.warn(`[${this.id}] an session is required to enable media tracks`);
      return;
    }

    if (this.session.state !== SessionState.Established) {
      this.logger.warn(`[${this.id}] an established session is required to enable media tracks`);
      return;
    }

    this.enableSenderTracks(true);
  }

  /**
   * Mute state.
   * True if sender's media track is disabled.
   */
  public isMuted(): boolean {
    const track = this.localAudioTrack || this.localVideoTrack;
    if (!track) {
      return false;
    }
    return !track.enabled;
  }

  /**
   * Send DTMF.
   * Send an INFO request with content type application/dtmf-relay.
   * @param tone - Tone to send.
   */
  public sendDTMF(tone: string): Promise<void> {
    this.logger.log(`[${this.id}] sending DTMF...`);

    // Validate tone
    if (!tone.match(/^[0-9A-D#*,]$/)) {
      return Promise.reject(new Error("Invalid DTMF tone."));
    }

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    this.logger.log("Sending DTMF tone: " + tone);
    const dtmf = tone;
    const duration = 2000;
    const body = {
      contentDisposition: "render",
      contentType: "application/dtmf-relay",
      content: "Signal=" + dtmf + "\r\nDuration=" + duration
    };
    const requestOptions = { body };

    return new Infoer(this.session).info({ requestOptions })
      .then(() => { return; });
  }

  /**
   * Send a message.
   * Send a MESSAGE request.
   * @param destination - The target destination for the message. A SIP address to send the MESSAGE to.
   */
  public message(destination: string, message: string): Promise<void> {
    this.logger.log(`[${this.id}] sending message...`);

    const target = UserAgent.makeURI(destination);
    if (!target) {
      return Promise.reject(new Error(`Failed to create a valid URI from "${destination}"`));
    }
    return new Messager(this.userAgent, target, message).message();
  }

  /** Media constraints. */
  private get constraints(): { audio: boolean, video: boolean } {
    let constraints = { audio: true, video: false }; // default to audio only calls
    if (this.options.media && this.options.media.constraints) {
      constraints = { ...this.options.media.constraints };
      if (!constraints.audio && !constraints.video) {
        throw new Error("Invalid media constraints - audio and/or video must be true.");
      }
    }
    return constraints;
  }

  /** Helper function to enable/disable media tracks. */
  private enableSenderTracks(enable: boolean): void {
    if (!this.session) {
      throw new Error("Session does not exist.");
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    peerConnection.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.enabled = enable;
      }
    });
  }

  /** The receiver media track, if available. */
  private getReceiverTrack(kind: "audio" | "video"): MediaStreamTrack | undefined {
    if (!this.session) {
      this.logger.warn(`[${this.id}] getReceiverTrack - session undefined`);
      return undefined;
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!sessionDescriptionHandler) {
      this.logger.warn(`[${this.id}] getReceiverTrack - session description handler undefined`);
      return undefined;
    }

    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    const rtpReceiver = peerConnection.getReceivers().find((receiver) => {
      return receiver.track.kind === kind ? true : false;
    });
    return rtpReceiver ? rtpReceiver.track : undefined;
  }

  /** The sender media track, if available. */
  private getSenderTrack(kind: "audio" | "video"): MediaStreamTrack | undefined {
    if (!this.session) {
      this.logger.warn(`[${this.id}] getSenderTrack - session undefined`);
      return undefined;
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!sessionDescriptionHandler) {
      this.logger.warn(`[${this.id}] getSenderTrack - session description handler undefined`);
      return undefined;
    }

    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
    }

    const peerConnection = sessionDescriptionHandler.peerConnection;
    const rtpSender = peerConnection.getSenders().find((sender) => {
      return sender.track && sender.track.kind === kind ? true : false;
    });
    return rtpSender && rtpSender.track ? rtpSender.track : undefined;
  }

  /**
   * Setup session delegate and state change handler.
   * @param session - Session to setup
   * @param referralInviterOptions - Options for any Inviter created as result of a REFER.
   */
  private initSession(
    session: Session,
    referralInviterOptions?: InviterOptions,
  ): void {
    // Set session
    this.session = session;

    // Call session created callback
    if (this.delegate && this.delegate.onCallCreated) {
      this.delegate.onCallCreated();
    }

    // Setup session state change handler
    this.session.stateChange.on((state: SessionState) => {
      if (this.session !== session) {
        return; // if our session has changed, just return
      }
      this.logger.log(`[${this.id}] session state changed to ${state}`);
      switch (state) {
        case SessionState.Initial:
          break;
        case SessionState.Establishing:
          break;
        case SessionState.Established:
          this.setupLocalMedia();
          this.setupRemoteMedia();
          if (this.delegate && this.delegate.onCallAnswered) {
            this.delegate.onCallAnswered();
          }
          break;
        case SessionState.Terminating:
          break;
        case SessionState.Terminated:
          this.session = undefined;
          this.cleanupMedia();
          if (this.delegate && this.delegate.onCallHangup) {
            this.delegate.onCallHangup();
          }
          break;
        default:
          throw new Error("Unknown session state.");
      }
    });

    // Setup delegate
    this.session.delegate = {
      onRefer: (referral: Referral) => {
        referral
          .accept()
          .then(() => this.sendInvite(referral.makeInviter(referralInviterOptions), referralInviterOptions))
          .catch((error: Error) => {
            this.logger.error(error.message);
          });
      }
    };
  }

  /** Helper function to init send then send invite. */
  private sendInvite(
    inviter: Inviter,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {

    // Initialize our session
    this.initSession(inviter, inviterOptions);

    // Send the INVITE
    return inviter.invite(inviterInviteOptions)
      .then((request) => {
        this.logger.log(`[${this.id}] sent INVITE`);
      });
  }

  /** Helper function to attach local media to html elements. */
  private setupLocalMedia(): void {
    if (!this.session) {
      throw new Error("Session does not exist.");
    }

    if (this.options.media && this.options.media.local && this.options.media.local.video) {
      const localVideoTrack = this.localVideoTrack;
      if (localVideoTrack) {
        const localStream = new MediaStream([localVideoTrack]);
        this.options.media.local.video.srcObject = localStream;
        this.options.media.local.video.volume = 0;
        this.options.media.local.video.play();
      }
    }
  }

  /** Helper function to attach remote media to html elements. */
  private setupRemoteMedia(): void {
    if (!this.session) {
      throw new Error("Session does not exist.");
    }

    if (this.options.media && this.options.media.remote) {
      const remoteAudioTrack = this.remoteAudioTrack;
      const remoteVideoTrack = this.remoteVideoTrack;
      const remoteStream = new MediaStream();

      // If there is a video element, both audio and video will be attached that element.
      if (this.options.media.remote.video) {
        if (remoteAudioTrack) {
          remoteStream.addTrack(remoteAudioTrack);
        }
        if (remoteVideoTrack) {
          remoteStream.addTrack(remoteVideoTrack);
        }
        this.options.media.remote.video.srcObject = remoteStream;
        this.options.media.remote.video.play()
          .catch((error: Error) => {
            this.logger.error(`[${this.id}] error playing video`);
            this.logger.error(error.message);
          });
      } else if (this.options.media.remote.audio) {
        if (remoteAudioTrack) {
          remoteStream.addTrack(remoteAudioTrack);
          this.options.media.remote.audio.srcObject = remoteStream;
          this.options.media.remote.audio.play()
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] error playing audio`);
              this.logger.error(error.message);
            });
          }
      }
    }
  }

  /** Helper function to remove media from html elements. */
  private cleanupMedia(): void {
    if (this.options.media) {
      if (this.options.media.local) {
        if (this.options.media.local.video) {
          this.options.media.local.video.srcObject = null;
          this.options.media.local.video.pause();
        }
      }
      if (this.options.media.remote) {
        if (this.options.media.remote.audio) {
          this.options.media.remote.audio.srcObject = null;
          this.options.media.remote.audio.pause();
        }
        if (this.options.media.remote.video) {
          this.options.media.remote.video.srcObject = null;
          this.options.media.remote.video.pause();
        }
      }
    }
  }
}
