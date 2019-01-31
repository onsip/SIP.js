export declare namespace C {
  export const USER_AGENT: string;

  export const SIP: string;
  export const SIPS: string;

  export const causes: {[name: string]: string};
  export type causes = any;
  export const supported: {[name: string]: string};
  export type supported = any;
  export const dtmfType: {[name: string]: string};
  export type dtmfType = any;

  export const SIP_ERROR_CAUSES: {[name: string]: Array<number>};

  export const ACK: string;
  export const BYE: string;
  export const CANCEL: string;
  export const INFO: string;
  export const INVITE: string;
  export const MESSAGE: string;
  export const NOTIFY: string;
  export const OPTIONS: string;
  export const REGISTER: string;
  export const UPDATE: string;
  export const SUBSCRIBE: string;
  export const PUBLISH: string;
  export const REFER: string;
  export const PRACK: string;

  export const REASON_PHRASE: {[code: number]: string};
  export const OPTION_TAGS: {[option: string]: boolean};
}