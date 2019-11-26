import { Exception } from "../../core";

/**
 * An exception indicating an invalid state transition error occured.
 * @public
 */
export class StateTransitionError extends Exception {
  public constructor(message?: string) {
    super(message ? message : "An error occurred during state transition.");
  }
}
