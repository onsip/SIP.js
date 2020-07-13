// Helpful name and version exports
import { LIBRARY_VERSION } from "./version";
const version = LIBRARY_VERSION;
const name = "sip.js";
export { name, version };
// Export api
export * from "./api";
// Export grammar
export * from "./grammar";
// Export namespaced core
import * as Core from "./core";
export { Core };
// Export namespaced web
import * as Web from "./platform/web";
export { Web };
