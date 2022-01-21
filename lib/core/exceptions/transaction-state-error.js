import { Exception } from "./exception";
/**
 * Indicates that the operation could not be completed given the current transaction state.
 * @public
 */
export class TransactionStateError extends Exception {
    constructor(message) {
        super(message ? message : "Transaction state error.");
    }
}
