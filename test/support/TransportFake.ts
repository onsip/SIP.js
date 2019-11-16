import { Logger } from "../../src/core";
import { Transport } from "../../src/Transport";

type ResolveFunction = () => void;
type RejectFunction = (reason: Error) => void;

export class TransportFake extends Transport {
  private _id: string = "";
  private peers: Array<TransportFake> = [];
  private waitingForSendPromise: Promise<void> | undefined;
  private waitingForSendResolve: ResolveFunction | undefined;
  private waitingForSendReject: RejectFunction | undefined;
  private waitingForReceivePromise: Promise<void> | undefined;
  private waitingForReceiveResolve: ResolveFunction | undefined;
  private waitingForReceiveReject: RejectFunction | undefined;

  constructor(logger: Logger, options: any) {
    super(logger, options);
  }

  set id(id: string) {
    this._id = id;
  }

  public addPeer(peer: TransportFake) {
    this.peers.push(peer);
  }

  public isConnected(): boolean {
    return true;
  }

  public receive(msg: string): void {
    let message = "";
    message += this._id ? `${this._id} ` : "";
    message +=  `Receiving...\n${msg}`;
    // this.logger.log(message);
    this.emit("message", msg);
    this.receiveHappened();
  }

  public async waitSent(): Promise<void> {
    if (this.waitingForSendPromise) {
      throw new Error("Already waiting for send.");
    }
    this.waitingForSendPromise = new Promise<void>((resolve, reject) => {
      this.waitingForSendResolve = resolve;
      this.waitingForSendReject = reject;
    });
    return this.waitingForSendPromise;
  }

  public async waitReceived(): Promise<void> {
    if (this.waitingForReceivePromise) {
      throw new Error("Already waiting for receive.");
    }
    this.waitingForReceivePromise = new Promise<void>((resolve, reject) => {
      this.waitingForReceiveResolve = resolve;
      this.waitingForReceiveReject = reject;
    });
    return this.waitingForReceivePromise;
  }

  protected connectPromise(options: any): Promise<any> {
    return Promise.resolve({});
  }

  protected sendPromise(msg: string, options?: any): Promise<any> {
    let message = "";
    message += this._id ? `${this._id} ` : "";
    message +=  `Sending...\n${msg}`;
    this.logger.log(message);
    return Promise.resolve().then(() => {
      this.peers.forEach((peer) => {
        peer.onMessage(msg);
      });
      this.sendHappened();
      return {};
    });
  }

  protected disconnectPromise(options: any): Promise<any> {
    return Promise.resolve({});
  }

  protected onMessage(msg: string): void {
    Promise.resolve().then(() => {
      this.receive(msg);
    });
  }

  private sendHappened(): void {
    if (this.waitingForSendResolve) {
      this.waitingForSendResolve();
    }
    this.waitingForSendPromise = undefined;
    this.waitingForSendResolve = undefined;
    this.waitingForSendReject = undefined;
  }

  private sendTimeout(): void {
    if (this.waitingForSendReject) {
      this.waitingForSendReject(new Error("Timed out waiting for send."));
    }
    this.waitingForSendPromise = undefined;
    this.waitingForSendResolve = undefined;
    this.waitingForSendReject = undefined;
  }

  private receiveHappened(): void {
    if (this.waitingForReceiveResolve) {
      this.waitingForReceiveResolve();
    }
    this.waitingForReceivePromise = undefined;
    this.waitingForReceiveResolve = undefined;
    this.waitingForReceiveReject = undefined;
  }

  private receiveTimeout(): void {
    if (this.waitingForReceiveReject) {
      this.waitingForReceiveReject(new Error("Timed out waiting for receive."));
    }
    this.waitingForReceivePromise = undefined;
    this.waitingForReceiveResolve = undefined;
    this.waitingForReceiveReject = undefined;
  }
}
