import { UserAgentOptions } from "../../api";
import { SimpleUserDelegate } from "./simple-user-delegate";
/**
 * Configuration options for SimpleUser.
 */
export interface SimpleUserOptions {
    /**
     * User's SIP Address of Record (AOR). The AOR is registered to receive incoming calls.
     * If not specified, a random anonymous address is created for the user.
     */
    aor?: string;
    /**
     * Delegate for SimpleUser.
     */
    delegate?: SimpleUserDelegate;
    /**
     * Media configuration.
     */
    media?: {
        /**
         * Offer/Answer constraints determine of audio and/or video are utilized.
         * If not specified, only audio is offered (audio is true, video is false).
         */
        constraints?: {
            audio: boolean;
            video: boolean;
        };
        /** HTML elements for local media streams. */
        local?: {
            /** The local video media stream is attached to this element. */
            video?: HTMLVideoElement;
        };
        /** Local HTML media elements. */
        remote?: {
            /** The remote audio media stream is attached to this element. */
            audio?: HTMLAudioElement;
            /** The remote video media stream is attached to this element. */
            video?: HTMLVideoElement;
        };
    };
    /**
     * Options for UserAgent.
     */
    userAgentOptions?: UserAgentOptions;
}
//# sourceMappingURL=simple-user-options.d.ts.map