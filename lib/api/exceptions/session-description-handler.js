import { Exception } from "../../core";
/**
 * An exception indicating a session description handler error occured.
 * @public
 */
export class SessionDescriptionHandlerError extends Exception {
    constructor(message) {
        super(message ? message : "Unspecified session description handler error.");
    }
}
