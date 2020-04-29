import {
  Info,
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
  RequestPendingError,
  Session,
  SessionInviteOptions,
  SessionState,
  UserAgent,
  UserAgentOptions,
  UserAgentState
} from "../../../api";
import { Logger } from "../../../core";
import { SessionDescriptionHandler } from "../session-description-handler";
import { Transport } from "../transport";
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
export class SimpleUser {
  /** Delegate. */
  public delegate: SimpleUserDelegate | undefined;

  private attemptingReconnection: boolean = false;
  private connectRequested: boolean = false;
  private logger: Logger;
  private held: boolean = false;
  private options: SimpleUserOptions;
  private registerer: Registerer | undefined = undefined;
  private registerRequested: boolean = false;
  private session: Session | undefined = undefined;
  private userAgent: UserAgent;

  /**
   * Constructs a new instance of the `SimpleUser` class.
   * @param server - SIP WebSocket Server URL.
   * @param options - Options bucket. See {@link SimpleUserOptions} for details.
   */
  constructor(server: string, options: SimpleUserOptions = {}) {
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
        server
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
      // Handle connection with server established
      onConnect: () => {
        this.logger.log(`[${this.id}] Connected`);
        if (this.delegate && this.delegate.onServerConnect) {
          this.delegate.onServerConnect();
        }
        if (this.registerer && this.registerRequested) {
          this.logger.log(`[${this.id}] Registering...`);
          this.registerer.register()
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred registering after connection with server was obtained.`);
              this.logger.error(e.toString());
            });
        }
      },
      // Handle connection with server lost
      onDisconnect: (error?: Error) => {
        this.logger.log(`[${this.id}] Disconnected`);
        if (this.delegate && this.delegate.onServerDisconnect) {
          this.delegate.onServerDisconnect(error);
        }
        if (this.session) {
          this.logger.log(`[${this.id}] Hanging up...`);
          this.hangup() // cleanup hung calls
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred hanging up call after connection with server was lost.`);
              this.logger.error(e.toString());
            });
        }
        if (this.registerer) {
          this.logger.log(`[${this.id}] Unregistering...`);
          this.registerer.unregister() // cleanup invalid registrations
            .catch((e: Error) => {
              this.logger.error(`[${this.id}] Error occurred unregistering after connection with server was lost.`);
              this.logger.error(e.toString());
            });
        }
        // Only attempt to reconnect if network/server dropped the connection.
        if (error) {
          this.attemptReconnection();
        }
      },
      // Handle incoming invitations
      onInvite: (invitation: Invitation) => {
        this.logger.log(`[${this.id}] Received INVITE`);

        // Guard against a pre-existing session. This implementation only supports one session at a time.
        // However an incoming INVITE request may be received at any time and/or while in the process
        // of sending an outgoing INVITE request. So we reject any incoming INVITE in those cases.
        if (this.session) {
          this.logger.warn(`[${this.id}] Session already in progress, rejecting INVITE...`);
          invitation.reject()
            .then(() => {
              this.logger.log(`[${this.id}] Rejected INVITE`);
            })
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] Failed to reject INVITE`);
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
          this.logger.warn(`[${this.id}] No handler available, rejecting INVITE...`);
          invitation.reject()
            .then(() => {
              this.logger.log(`[${this.id}] Rejected INVITE`);
            })
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] Failed to reject INVITE`);
              this.logger.error(error.toString());
            });
        }
      },
      // Handle incoming messages
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

    // Monitor network connectivity and attempt reconnection when we come online
    window.addEventListener("online", () => {
      this.logger.log(`[${this.id}] Online`);
      this.attemptReconnection();
    });
  }

  /**
   * Instance identifier.
   * @internal
   */
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
   * @remarks
   * Start the UserAgent's WebSocket Transport.
   */
  public connect(): Promise<void> {
    this.logger.log(`[${this.id}] Connecting UserAgent...`);
    this.connectRequested = true;
    if (this.userAgent.state !== UserAgentState.Started) {
      return this.userAgent.start();
    }
    return this.userAgent.reconnect();
  }

  /**
   * Disconnect.
   * @remarks
   * Stop the UserAgent's WebSocket Transport.
   */
  public disconnect(): Promise<void> {
    this.logger.log(`[${this.id}] Disconnecting UserAgent...`);
    this.connectRequested = false;
    return this.userAgent.stop();
  }

  /**
   * Return true if connected.
   */
  public isConnected(): boolean {
    return this.userAgent.isConnected();
  }

  /**
   * Start receiving incoming calls.
   * @remarks
   * Send a REGISTER request for the UserAgent's AOR.
   * Resolves when the REGISTER request is sent, otherwise rejects.
   */
  public register(
    registererOptions?: RegistererOptions,
    registererRegisterOptions?: RegistererRegisterOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Registering UserAgent...`);
    this.registerRequested = true;

    if (!this.registerer) {
      this.registerer = new Registerer(this.userAgent, registererOptions);
      this.registerer.stateChange.addListener((state: RegistererState) => {
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
   * @remarks
   * Send an un-REGISTER request for the UserAgent's AOR.
   * Resolves when the un-REGISTER request is sent, otherwise rejects.
   */
  public unregister(
    registererUnregisterOptions?: RegistererUnregisterOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Unregistering UserAgent...`);
    this.registerRequested = false;

    if (!this.registerer) {
      return Promise.resolve();
    }

    return this.registerer.unregister(registererUnregisterOptions)
      .then(() => { return; });
  }

  /**
   * Make an outgoing call.
   * @remarks
   * Send an INVITE request to create a new Session.
   * Resolves when the INVITE request is sent, otherwise rejects.
   * Use `onCallAnswered` delegate method to determine if Session is established.
   * @param destination - The target destination to call. A SIP address to send the INVITE to.
   */
  public call(
    destination: string,
    inviterOptions?: InviterOptions,
    inviterInviteOptions?: InviterInviteOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Beginning Session...`);

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
   * @remarks
   * Send a BYE request, CANCEL request or reject response to end the current Session.
   * Resolves when the request/response is sent, otherwise rejects.
   * Use `onCallTerminated` delegate method to determine if and when call is ended.
   */
  public hangup(): Promise<void> {
    this.logger.log(`[${this.id}] Hangup...`);
    return this.terminate();
  }

  /**
   * Answer an incoming call.
   * @remarks
   * Accept an incoming INVITE request creating a new Session.
   * Resolves with the response is sent, otherwise rejects.
   * Use `onCallAnswered` delegate method to determine if and when call is established.
   */
  public answer(
    invitationAcceptOptions?: InvitationAcceptOptions
  ): Promise<void> {
    this.logger.log(`[${this.id}] Accepting Invitation...`);

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
   * @remarks
   * Reject an incoming INVITE request.
   * Resolves with the response is sent, otherwise rejects.
   * Use `onCallTerminated` delegate method to determine if and when call is ended.
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
   * Hold call
   * @remarks
   * Send a re-INVITE with new offer indicating "hold".
   * Resolves when the re-INVITE request is sent, otherwise rejects.
   * Use `onCallHold` delegate method to determine if request is accepted or rejected.
   * See: https://tools.ietf.org/html/rfc6337
   */
  public hold(): Promise<void> {
    this.logger.log(`[${this.id}] holding session...`);
    return this.setHold(true);
  }

  /**
   * Unhold call.
   * @remarks
   * Send a re-INVITE with new offer indicating "unhold".
   * Resolves when the re-INVITE request is sent, otherwise rejects.
   * Use `onCallHold` delegate method to determine if request is accepted or rejected.
   * See: https://tools.ietf.org/html/rfc6337
   */
  public unhold(): Promise<void> {
    this.logger.log(`[${this.id}] unholding session...`);
    return this.setHold(false);
  }

  /**
   * Hold state.
   * @remarks
   * True if session media is on hold.
   */
  public isHeld(): boolean {
    return this.held;
  }

  /**
   * Mute call.
   * @remarks
   * Disable sender's media tracks.
   */
  public mute(): void {
    this.logger.log(`[${this.id}] disabling media tracks...`);
    this.setMute(true);
  }

  /**
   * Unmute call.
   * @remarks
   * Enable sender's media tracks.
   */
  public unmute(): void {
    this.logger.log(`[${this.id}] enabling media tracks...`);
    this.setMute(false);
  }

  /**
   * Mute state.
   * @remarks
   * True if sender's media track is disabled.
   */
  public isMuted(): boolean {
    const track = this.localAudioTrack || this.localVideoTrack;
    return track ? !track.enabled : false;
  }

  /**
   * Send DTMF.
   * @remarks
   * Send an INFO request with content type application/dtmf-relay.
   * @param tone - Tone to send.
   */
  public sendDTMF(tone: string): Promise<void> {
    this.logger.log(`[${this.id}] sending DTMF...`);

    // As RFC 6086 states, sending DTMF via INFO is not standardized...
    //
    // Companies have been using INFO messages in order to transport
    // Dual-Tone Multi-Frequency (DTMF) tones.  All mechanisms are
    // proprietary and have not been standardized.
    // https://tools.ietf.org/html/rfc6086#section-2
    //
    // It is however widely supported based on this draft:
    // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00

    // Validate tone
    if (!tone.match(/^[0-9A-D#*,]$/)) {
      return Promise.reject(new Error("Invalid DTMF tone."));
    }

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    // The UA MUST populate the "application/dtmf-relay" body, as defined
    // earlier, with the button pressed and the duration it was pressed
    // for.  Technically, this actually requires the INFO to be generated
    // when the user *releases* the button, however if the user has still
    // not released a button after 5 seconds, which is the maximum duration
    // supported by this mechanism, the UA should generate the INFO at that
    // time.
    // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00#section-5.3
    this.logger.log(`[${this.id}] Sending DTMF tone: ${tone}`);
    const dtmf = tone;
    const duration = 2000;
    const body = {
      contentDisposition: "render",
      contentType: "application/dtmf-relay",
      content: "Signal=" + dtmf + "\r\nDuration=" + duration
    };
    const requestOptions = { body };

    return this.session.info({ requestOptions })
      .then(() => { return; });
  }

  /**
   * Send a message.
   * @remarks
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

  /**
   * Attempt reconnection up to `maxReconnectionAttempts` times.
   * @param reconnectionAttempt - Current attempt number.
   */
  private attemptReconnection(reconnectionAttempt: number = 1): void {
    const reconnectionAttempts = this.options.reconnectionAttempts || 3;
    const reconnectionDelay = this.options.reconnectionDelay || 4;

    if (!this.connectRequested) {
      this.logger.log(`[${this.id}] Reconnection not currently desired`);
      return; // If intentionally disconnected, don't reconnect.
    }

    if (this.attemptingReconnection) {
      this.logger.log(`[${this.id}] Reconnection attempt already in progress`);
    }

    if (reconnectionAttempt > reconnectionAttempts) {
      this.logger.log(`[${this.id}] Reconnection maximum attempts reached`);
      return;
    }

    if (reconnectionAttempt === 1) {
      this.logger.log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying`);
    } else {
      this.logger.log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - trying in ${reconnectionDelay} seconds`);
    }

    this.attemptingReconnection = true;

    setTimeout(() => {
      if (!this.connectRequested) {
        this.logger
          .log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - aborted`);
        this.attemptingReconnection = false;
        return; // If intentionally disconnected, don't reconnect.
      }
      this.userAgent.reconnect()
        .then(() => {
          this.logger
            .log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - succeeded`);
          this.attemptingReconnection = false;
        })
        .catch((error: Error) => {
          this.logger
            .log(`[${this.id}] Reconnection attempt ${reconnectionAttempt} of ${reconnectionAttempts} - failed`);
          this.logger.error(error.message);
          this.attemptingReconnection = false;
          this.attemptReconnection(++reconnectionAttempt);
        });
    }, reconnectionAttempt === 1 ? 0 : reconnectionDelay * 1000);
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
    this.session.stateChange.addListener((state: SessionState) => {
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
          // fall through
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
      onInfo: (info: Info) => {

        // As RFC 6086 states, sending DTMF via INFO is not standardized...
        //
        // Companies have been using INFO messages in order to transport
        // Dual-Tone Multi-Frequency (DTMF) tones.  All mechanisms are
        // proprietary and have not been standardized.
        // https://tools.ietf.org/html/rfc6086#section-2
        //
        // It is however widely supported based on this draft:
        // https://tools.ietf.org/html/draft-kaplan-dispatch-info-dtmf-package-00

        // FIXME: TODO: We should reject correctly...
        //
        // If a UA receives an INFO request associated with an Info Package that
        // the UA has not indicated willingness to receive, the UA MUST send a
        // 469 (Bad Info Package) response (see Section 11.6), which contains a
        // Recv-Info header field with Info Packages for which the UA is willing
        // to receive INFO requests.
        // https://tools.ietf.org/html/rfc6086#section-4.2.2

        // No delegate
        if (!this.delegate || !this.delegate.onCallDTMFReceived) {
          info.reject();
          return;
        }

        // Invalid content type
        const contentType = info.request.getHeader("content-type");
        if (!contentType || !contentType.match(/^application\/dtmf-relay/i)) {
          info.reject();
          return;
        }

        // Invalid body
        const body = info.request.body.split("\r\n", 2);
        if (body.length !== 2) {
          info.reject();
          return;
        }

        // Invalid tone
        let tone: string | undefined;
        const toneRegExp = /^(Signal\s*?=\s*?)([0-9A-D#*]{1})(\s)?.*/;
        if (toneRegExp.test(body[0])) {
          tone = body[0].replace(toneRegExp, "$2");
        }
        if (!tone) {
          info.reject();
          return;
        }

        // Invalid duration
        let duration: number | undefined;
        const durationRegExp = /^(Duration\s?=\s?)([0-9]{1,4})(\s)?.*/;
        if (durationRegExp.test(body[1])) {
          duration = parseInt(body[1].replace(durationRegExp, "$2"), 10);
        }
        if (!duration) {
          info.reject();
          return;
        }

        info
          .accept()
          .then(() => {
            if (this.delegate && this.delegate.onCallDTMFReceived) {
              if (!tone || !duration) {
                throw new Error("Tone or duration undefined.");
              }
              this.delegate.onCallDTMFReceived(tone, duration);
            }
          })
          .catch((error: Error) => {
            this.logger.error(error.message);
          });
      },
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

  /**
   * Puts Session on hold.
   * @param hold - Hold on if true, off if false.
   */
  private setHold(hold: boolean): Promise<void> {
    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    // Just resolve if we are already in correct state
    if (this.held === hold) {
      return Promise.resolve();
    }

    const sessionDescriptionHandler = this.session.sessionDescriptionHandler;
    if (!(sessionDescriptionHandler instanceof SessionDescriptionHandler)) {
      throw new Error("Session's session description handler not instance of SessionDescriptionHandler.");
    }

    const options: SessionInviteOptions = {
      requestDelegate: {
        onAccept: () => {
          this.held = hold;
          if (this.delegate && this.delegate.onCallHold) {
            this.delegate.onCallHold(this.held);
          }
        },
        onReject: () => {
          this.logger.warn(`[${this.id}] re-invite request was rejected`);
          if (this.delegate && this.delegate.onCallHold) {
            this.delegate.onCallHold(this.held);
          }
        }
      }
    };

    // Use hold modifier to produce the appropriate SDP offer to place call on hold
    if (hold) {
      options.sessionDescriptionHandlerModifiers = [sessionDescriptionHandler.holdModifier];
    }

    // Send re-INVITE
    return this.session.invite(options)
      .then(() => {
        this.enableSenderTracks(!hold); // mute/unmute
      })
      .catch((error: Error) => {
        if (error instanceof RequestPendingError) {
          this.logger.error(`[${this.id}] A hold request is already in progress.`);
        }
        throw error;
      });
  }

  /**
   * Puts Session on mute.
   * @param mute - Mute on if true, off if false.
   */
  private setMute(mute: boolean): void {
    if (!this.session) {
      this.logger.warn(`[${this.id}] A session is required to enabled/disable media tracks`);
      return;
    }

    if (this.session.state !== SessionState.Established) {
      this.logger.warn(`[${this.id}] An established session is required to enable/disable media tracks`);
      return;
    }

    this.enableSenderTracks(!mute);
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
            this.logger.error(`[${this.id}] Error playing video`);
            this.logger.error(error.message);
          });
      } else if (this.options.media.remote.audio) {
        if (remoteAudioTrack) {
          remoteStream.addTrack(remoteAudioTrack);
          this.options.media.remote.audio.srcObject = remoteStream;
          this.options.media.remote.audio.play()
            .catch((error: Error) => {
              this.logger.error(`[${this.id}] Error playing audio`);
              this.logger.error(error.message);
            });
          }
      }
    }
  }

  /**
   * End a session.
   * @remarks
   * Send a BYE request, CANCEL request or reject response to end the current Session.
   * Resolves when the request/response is sent, otherwise rejects.
   * Use `onCallTerminated` delegate method to determine if and when Session is terminated.
   */
  private terminate(): Promise<void> {
    this.logger.log(`[${this.id}] Terminating...`);

    if (!this.session) {
      return Promise.reject(new Error("Session does not exist."));
    }

    switch (this.session.state) {
      case SessionState.Initial:
        if (this.session instanceof Inviter) {
          return this.session.cancel()
            .then(() => {
              this.logger.log(`[${this.id}] Inviter never sent INVITE (canceled)`);
            });
        } else if (this.session instanceof Invitation) {
          return this.session.reject()
            .then(() => {
              this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
            });
        } else {
          throw new Error("Unknown session type.");
        }
      case SessionState.Establishing:
        if (this.session instanceof Inviter) {
          return this.session.cancel()
            .then(() => {
              this.logger.log(`[${this.id}] Inviter canceled (sent CANCEL)`);
            });
        } else if (this.session instanceof Invitation) {
          return this.session.reject()
            .then(() => {
              this.logger.log(`[${this.id}] Invitation rejected (sent 480)`);
            });
        } else {
          throw new Error("Unknown session type.");
        }
      case SessionState.Established:
        return this.session.bye()
          .then(() => {
            this.logger.log(`[${this.id}] Session ended (sent BYE)`);
          });
      case SessionState.Terminating:
        break;
      case SessionState.Terminated:
        break;
      default:
        throw new Error("Unknown state");
    }

    this.logger.log(`[${this.id}] Terminating in state ${this.session.state}, no action taken`);
    return Promise.resolve();
  }
}
