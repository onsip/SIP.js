import { SessionDescriptionHandlerModifier } from "../../api";
/**
 * Modifier.
 * @public
 */
export declare function stripTcpCandidates(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
/**
 * Modifier.
 * @public
 */
export declare function stripTelephoneEvent(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
/**
 * Modifier.
 * @public
 */
export declare function cleanJitsiSdpImageattr(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
/**
 * Modifier.
 * @public
 */
export declare function stripG722(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
/**
 * Modifier.
 * @public
 */
export declare function stripRtpPayload(payload: string): SessionDescriptionHandlerModifier;
/**
 * Modifier.
 * @public
 */
export declare function stripVideo(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
/**
 * Modifier.
 * @public
 */
export declare function addMidLines(description: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
//# sourceMappingURL=modifiers.d.ts.map