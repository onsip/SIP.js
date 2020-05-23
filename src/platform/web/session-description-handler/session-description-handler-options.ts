import { SessionDescriptionHandlerOptions as SessionDescriptionHandlerOptionsDefinition } from "../../../api";

/**
 * Options for {@link SessionDescriptionHandler}.
 * @public
 */
export interface SessionDescriptionHandlerOptions extends SessionDescriptionHandlerOptionsDefinition {
  /**
   * Answer options to use when creating an answer.
   */
  answerOptions?: RTCAnswerOptions;

  /**
   * Constraints to use when creating local media stream.
   */
  constraints?: MediaStreamConstraints;

  /**
   * The maximum duration to wait in ms for ICE gathering to complete.
   * No timeout if undefined or zero.
   */
  iceGatheringTimeout?: number;

  /**
   * Offer options to use when creating an offer.
   */
  offerOptions?: RTCOfferOptions;
}
