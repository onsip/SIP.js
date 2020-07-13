/**
 * @internal
 */
export class Parameters {
    constructor(parameters) {
        this.parameters = {};
        for (const param in parameters) {
            // eslint-disable-next-line no-prototype-builtins
            if (parameters.hasOwnProperty(param)) {
                this.setParam(param, parameters[param]);
            }
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setParam(key, value) {
        if (key) {
            this.parameters[key.toLowerCase()] = (typeof value === "undefined" || value === null) ? null : value.toString();
        }
    }
    getParam(key) {
        if (key) {
            return this.parameters[key.toLowerCase()];
        }
    }
    hasParam(key) {
        if (key) {
            // eslint-disable-next-line no-prototype-builtins
            return !!this.parameters.hasOwnProperty(key.toLowerCase());
        }
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteParam(parameter) {
        parameter = parameter.toLowerCase();
        // eslint-disable-next-line no-prototype-builtins
        if (this.parameters.hasOwnProperty(parameter)) {
            const value = this.parameters[parameter];
            delete this.parameters[parameter];
            return value;
        }
    }
    clearParams() {
        this.parameters = {};
    }
}
