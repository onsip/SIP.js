/// <reference types="node" />
import { EventEmitter } from "events";
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
export declare abstract class Transaction extends EventEmitter {
    private _transport;
    private _user;
    private _id;
    private _state;
    protected logger: Logger;
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
    readonly id: string;
    /** Transaction kind. Deprecated. */
    readonly kind: string;
    /** Transaction state. */
    readonly state: TransactionState;
    /** Transaction transport. */
    readonly transport: Transport;
    /** Subscribe to 'stateChanged' event. */
    on(name: "stateChanged", callback: () => void): this;
    protected logTransportError(error: TransportError, message: string): void;
    protected abstract onTransportError(error: TransportError): void;
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @returns
     * Rejects with `TransportError` if transport fails.
     */
    protected send(message: string): Promise<void>;
    protected setState(state: TransactionState): void;
    protected typeToString(): string;
}
//# sourceMappingURL=transaction.d.ts.map