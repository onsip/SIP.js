import { ClientContext } from "./ClientContext";
import { IncomingRequest, NameAddrHeader, Session, URI } from "./core";
import { SessionStatus, TypeStrings } from "./Enums";
import { ServerContext } from "./ServerContext";
import { InviteClientContext, InviteServerContext } from "./Session";
import { SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { UA } from "./UA";
export declare namespace ReferServerContext {
    interface AcceptOptions {
        /** If true, accept REFER request and automatically attempt to follow it. */
        followRefer?: boolean;
        /** If followRefer is true, options to following INVITE request. */
        inviteOptions?: InviteClientContext.Options;
    }
    interface RejectOptions {
    }
}
export declare class ReferClientContext extends ClientContext {
    type: TypeStrings;
    protected extraHeaders: Array<string>;
    protected options: any;
    protected applicant: InviteClientContext | InviteServerContext;
    protected target: URI | string;
    private errorListener;
    constructor(ua: UA, applicant: InviteClientContext | InviteServerContext, target: InviteClientContext | InviteServerContext | string, options?: any);
    refer(options?: any): ReferClientContext;
    receiveNotify(request: IncomingRequest): void;
    protected initReferTo(target: InviteClientContext | InviteServerContext | string): string | URI;
}
export declare class ReferServerContext extends ServerContext {
    private session?;
    type: TypeStrings;
    referTo: NameAddrHeader;
    targetSession: InviteClientContext | InviteServerContext | undefined;
    protected status: SessionStatus;
    protected fromTag: string;
    protected fromUri: URI;
    protected toUri: URI;
    protected toTag: string;
    protected routeSet: Array<string>;
    protected remoteTarget: URI;
    protected id: string;
    protected callId: string;
    protected cseq: number;
    protected contact: string;
    protected referredBy: string | undefined;
    protected referredSession: InviteClientContext | InviteServerContext | undefined;
    protected replaces: string | undefined;
    protected errorListener: (() => void);
    constructor(ua: UA, incomingRequest: IncomingRequest, session?: Session | undefined);
    progress(): void;
    reject(options?: ReferServerContext.RejectOptions): void;
    accept(options?: ReferServerContext.AcceptOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
    sendNotify(bodyStr: string): void;
    on(name: "referAccepted" | "referInviteSent" | "referProgress" | "referRejected" | "referRequestAccepted" | "referRequestRejected", callback: (referServerContext: ReferServerContext) => void): this;
}
//# sourceMappingURL=ReferContext.d.ts.map