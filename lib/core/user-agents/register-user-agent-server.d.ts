import { IncomingRegisterRequest, IncomingRequestDelegate, IncomingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentServer } from "./user-agent-server";
/**
 * REGISTER UAS.
 * @public
 */
export declare class RegisterUserAgentServer extends UserAgentServer implements IncomingRegisterRequest {
    protected core: UserAgentCore;
    constructor(core: UserAgentCore, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
}
//# sourceMappingURL=register-user-agent-server.d.ts.map