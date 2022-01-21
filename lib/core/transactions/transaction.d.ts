import { TransportError } from "../exceptions";
import { Logger } from "../log";
import { Transport } from "../transport";
import { TransactionState } from "./transaction-state";
import { TransactionUser } from "./transaction-user";
/**
 * Transaction.
 * @remarks
 * SIP is a transactional protocol: interactions between components take
 * place in a series of independent message exchanges.  Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses.  In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response.  If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 * @public
 */
export declare abstract class Transaction {
    private _transport;
    private _user;
    private _id;
    private _state;
    protected logger: Logger;
    private listeners;
    protected constructor(_transport: Transport, _user: TransactionUser, _id: string, _state: TransactionState, loggerCategory: string);
    /**
     * Destructor.
     * Once the transaction is in the "terminated" state, it is destroyed
     * immediately and there is no need to call `dispose`. However, if a
     * transaction needs to be ended prematurely, the transaction user may
     * do so by calling this method (for example, perhaps the UA is shutting down).
     * No state transition will occur upon calling this method, all outstanding
     * transmission timers will be cancelled, and use of the transaction after
     * calling `dispose` is undefined.
     */
    dispose(): void;
    /** Transaction id. */
    get id(): string;
    /** Transaction kind. Deprecated. */
    get kind(): string;
    /** Transaction state. */
    get state(): TransactionState;
    /** Transaction transport. */
    get transport(): Transport;
    /**
     * Sets up a function that will be called whenever the transaction state changes.
     * @param listener - Callback function.
     * @param options - An options object that specifies characteristics about the listener.
     *                  If once true, indicates that the listener should be invoked at most once after being added.
     *                  If once true, the listener would be automatically removed when invoked.
     */
    addStateChangeListener(listener: () => void, options?: {
        once?: boolean;
    }): void;
    /**
     * This is currently public so tests may spy on it.
     * @internal
     */
    notifyStateChangeListeners(): void;
    /**
     * Removes a listener previously registered with addStateListener.
     * @param listener - Callback function.
     */
    removeStateChangeListener(listener: () => void): void;
    protected logTransportError(error: TransportError, message: string): void;
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @returns
     * Rejects with `TransportError` if transport fails.
     */
    protected send(message: string): Promise<void>;
    protected setState(state: TransactionState): void;
    protected typeToString(): string;
    protected abstract onTransportError(error: TransportError): void;
}
//# sourceMappingURL=transaction.d.ts.map