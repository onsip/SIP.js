import { SessionDescriptionHandlerModifier } from "../session-description-handler";
export declare function stripTcpCandidates(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
export declare function stripTelephoneEvent(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
export declare function cleanJitsiSdpImageattr(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
export declare function stripG722(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
export declare function stripRtpPayload(payload: string): SessionDescriptionHandlerModifier;
export declare function stripVideo(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
export declare function addMidLines(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
//# sourceMappingURL=Modifiers.d.ts.map