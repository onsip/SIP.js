export * from "./event-emitter";
export * from "./session";
export * from "./session-description-handler";
export * from "./session-description-handler-factory";
export * from "./ua";
export * from "./uri";
export * from "./Web"

export var name: string;
export var version: string;

// TODO & FIXME
// If these are on the official public SIP.js API, then they should be typed.
// If not, these are leaking out of SIP.js up our application stack, so
// comment them out and compile to see where, then clean up their usage.

export namespace C {
  export enum supported {
    UNSUPPORTED = 'none',
    SUPPORTED = 'supported',
    REQUIRED = 'required'
  }

  export enum DtmfType {
    INFO = 'info',
    RTP = 'rtp'
  }
}

export var Exceptions: any;
export var Grammar: any;
export var Timers: any;
export var Utils: any;

export class OutgoingRequest {}

export class ServerContext {}
