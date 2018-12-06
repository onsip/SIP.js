import {SessionDescriptionHandler, SessionDescriptionHandlerModifiers, SessionDescriptionHandlerOptions} from "../session-description-handler";

export class WebSessionDescriptionHandler implements SessionDescriptionHandler {
  close(): void;
  getDescription(options?: WebSessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<{ body: string; contentType: string }>;
  hasDescription(contentType: string): boolean;
  holdModifier(sessionDescription: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  setDescription(sdp: string, options?: WebSessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): Promise<void>;

  on(name: 'getDescription', callback: (description: RTCSessionDescriptionInit) => void): void;
  on(name: 'peerConnection-setRemoteDescriptionFailed', callback: (error: any) => void): void; // TODO: SessionDescriptionHandlerException
  on(name: 'setDescription', callback: (description: RTCSessionDescriptionInit) => void): void;
  on(name: 'setRemoteDescription', callback: (receivers: Array<RTCRtpReceiver>) => void): void;
  on(name: 'confirmed', callback: (sessionDescriptionHandler: WebSessionDescriptionHandler) => void): void;

  on(name: 'peerConnection-createAnswerFailed' | 'peerConnection-createOfferFailed', callback: (error: any) => void): void; // TODO:
  on(name: 'peerConnection-SetLocalDescriptionFailed', callback: (error: any) => void): void;
  on(name: 'addTrack', callback: (track: MediaStreamTrack) => void): void;
  on(name: 'iceCandidate', callback: (candidate: RTCIceCandidate) => void): void;
  on(name: 'iceConnection' | 'iceConnectionChecking' | 'iceConnectionConnected' | 'iceConnectionCompleted' | 'iceConnectionFailed' | 'iceConnectionDisconnected' | 'iceConectionClosed', callback: (sessionDescriptionHandler: WebSessionDescriptionHandler) => void): void;
  on(name: 'iceGathering' | 'iceGatheringComplete', callback: (sessionDescriptionHandler: WebSessionDescriptionHandler) => void): void;

  on(name: 'userMediaRequest', callback: (constraints: MediaStreamConstraints) => void): void;
  on(name: 'userMedia', callback: (streams: MediaStream) => void): void;
  on(name: 'userMediaFailed', callback: (error: any) => void): void;

}

export interface WebSessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptions {
  peerConnectionOptions?: PeerConnectionOptions;
  alwaysAcquireMediaFirst?: boolean;
  disableAudioFallback?: boolean;
  RTCOfferOptiobns?: any;
}

export interface PeerConnectionOptions {
  iceCheckingTimeout?: number;
  rtcConfiguration?: any;
}