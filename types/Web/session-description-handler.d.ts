import { EventEmitter } from "events";

import { Logger } from "../logger-factory";
import { InviteClientContext, InviteServerContext } from "../session";
import {
  BodyObj,
  SessionDescriptionHandler as BaseSessionDescriptionHandler,
  SessionDescriptionHandlerModifiers,
  SessionDescriptionHandlerOptions
} from "../session-description-handler";
import { SessionDescriptionHandlerObserver } from "../session-description-handler-observer";

import { TypeStrings } from "../enums";

export declare class WebSessionDescriptionHandler extends EventEmitter implements BaseSessionDescriptionHandler {
  static defaultFactory(
    session: InviteClientContext | InviteServerContext,
    options: any
  ): BaseSessionDescriptionHandler;

  type: TypeStrings;
  peerConnection: RTCPeerConnection;  // peer connection is created in constructor, and never unset

  constructor(logger: Logger, observer: SessionDescriptionHandlerObserver, options: any);

  close(): void;
  getDescription(options?: WebSessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<BodyObj>;
  hasDescription(contentType: string): boolean;
  holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  setDescription(sdp: string, options?: WebSessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<void>;
  sendDtmf(tones: string, options: any): boolean;
  getDirection(): string;

  on(event: 'getDescription', listener: (description: RTCSessionDescriptionInit) => void): this;
  on(event: 'peerConnection-setRemoteDescriptionFailed', listener: (error: any) => void): this; // TODO: SessionDescriptionHandlerException
  on(event: 'setDescription', listener: (description: RTCSessionDescriptionInit) => void): this;
  on(event: 'setRemoteDescription', listener: (receivers: Array<RTCRtpReceiver>) => void): this;
  on(event: 'confirmed', listener: (sessionDescriptionHandler: WebSessionDescriptionHandler) => void): this;

  on(event: 'peerConnection-createAnswerFailed' | 'peerConnection-createOfferFailed', listener: (error: any) => void): this; // TODO:
  on(event: 'peerConnection-SetLocalDescriptionFailed', listener: (error: any) => void): this;
  on(event: 'addTrack', listener: (track: MediaStreamTrack) => void): this;
  on(event: 'addStream', listener: (track: MediaStream) => void): this;
  on(event: 'iceCandidate', listener: (candidate: RTCIceCandidate) => void): this;
  on(event: 'iceConnection' | 'iceConnectionChecking' | 'iceConnectionConnected' | 'iceConnectionCompleted' | 'iceConnectionFailed' | 'iceConnectionDisconnected' | 'iceConectionClosed', listener: (sessionDescriptionHandler: WebSessionDescriptionHandler) => void): this;
  on(event: 'iceGathering' | 'iceGatheringComplete', listener: (sessionDescriptionHandler: WebSessionDescriptionHandler) => void): this;

  on(event: 'userMediaRequest', listener: (constraints: MediaStreamConstraints) => void): this;
  on(event: 'userMedia', listener: (streams: MediaStream) => void): this;
  on(event: 'userMediaFailed', listener: (error: any) => void): this;
}

export interface WebSessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptions {
  peerConnectionOptions?: PeerConnectionOptions;
  alwaysAcquireMediaFirst?: boolean;
  disableAudioFallback?: boolean;
  RTCOfferOptions?: any;
  constraints?: any;
}

export interface PeerConnectionOptions {
  iceCheckingTimeout?: number;
  rtcConfiguration?: any;
}
