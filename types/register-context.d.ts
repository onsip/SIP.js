import { ClientContext } from "./client-context";
import { IncomingResponse } from "./sip-message";
import { UA } from "./ua";

export declare class RegisterContext extends ClientContext {
  registered: boolean;
  cseq: number;

  constructor(ua: UA, options?: any);

  register(options?: any): void;
  close(): void;
  unregister(options?: any): void;
  unregistered(response?: IncomingResponse, cause?: string): void;
}

export declare namespace RegisterContext {
  interface RegistrationConfiguration {
    expires?: string;
    extraContactHeaderParams?: Array<string>;
    instanceId?: string;
    params?: any;
    regId?: number;
    registrar?: string;
  }
}