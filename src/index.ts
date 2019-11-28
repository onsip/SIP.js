// Helpful name and version exports
import { LIBRARY_VERSION } from "./version";
const version = LIBRARY_VERSION;
const name = "sip.js";
export { name, version };

// Export entire api at root level
export * from "./api";

// Export selected core items at root level
export {
  Grammar,
  URI
} from "./core";

// Export entire core namespaced
import * as Core from "./core";
export { Core };

// Export entire web namespaced
import * as Web from "./platform/web";
export { Web };
