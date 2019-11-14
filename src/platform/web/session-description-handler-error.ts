import { Exception } from "../../core";

/**
 * Session description handler error.
 * @public
 */
export class SessionDescriptionHandlerError extends Exception {
  constructor(message?: string) {
    super(message ? message : "Unspecified session description handler error.");
  }
}
