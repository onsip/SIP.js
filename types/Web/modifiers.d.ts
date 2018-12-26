import { SessionDescriptionHandlerModifier } from "../session-description-handler";

export declare namespace Modifiers {
  export const stripTcpCandidates: SessionDescriptionHandlerModifier;
  export const stripTelephoneEvent: SessionDescriptionHandlerModifier;
  export const cleanJitsiSdpImageattr: SessionDescriptionHandlerModifier;
  export const stripG722: SessionDescriptionHandlerModifier;
  export const stripRtpPayload: SessionDescriptionHandlerModifier;
  export const stripVideo: SessionDescriptionHandlerModifier;
  export const addMidLines: SessionDescriptionHandlerModifier;
}