/// <reference types="node" />
import { EventEmitter } from "events";
import { Logger } from "../core";
import { InviteClientContext, InviteServerContext } from "../Session";
import { UA } from "../UA";
export declare enum SimpleStatus {
    STATUS_NULL = 0,
    STATUS_NEW = 1,
    STATUS_CONNECTING = 2,
    STATUS_CONNECTED = 3,
    STATUS_COMPLETED = 4
}
export declare class Simple extends EventEmitter {
    static readonly C: typeof SimpleStatus;
    video: boolean;
    audio: boolean;
    anonymous: boolean;
    options: any;
    ua: UA;
    state: SimpleStatus;
    logger: Logger;
    session: InviteClientContext | InviteServerContext | undefined;
    constructor(options: any);
    call(destination: string): InviteClientContext | InviteServerContext | void;
    answer(): InviteServerContext | void;
    reject(): InviteServerContext | undefined;
    hangup(): InviteClientContext | InviteServerContext | undefined;
    hold(): InviteClientContext | InviteServerContext | void;
    unhold(): InviteClientContext | InviteServerContext | void;
    mute(): void;
    unmute(): void;
    sendDTMF(tone: string): void;
    message(destination: string, message: string): void;
    private checkRegistration;
    private setupRemoteMedia;
    private setupLocalMedia;
    private cleanupMedia;
    private setupSession;
    private destroyMedia;
    private toggleMute;
    private onAccepted;
    private onProgress;
    private onFailed;
    private onEnded;
}
//# sourceMappingURL=Simple.d.ts.map