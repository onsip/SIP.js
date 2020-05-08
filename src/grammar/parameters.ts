/**
 * @internal
 */
export class Parameters {
  public parameters: {[name: string]: string} = {};

  constructor(parameters: {[name: string]: string}) {
    for (const param in parameters) {
      // eslint-disable-next-line no-prototype-builtins
      if (parameters.hasOwnProperty(param)) {
        this.setParam(param, parameters[param]);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public setParam(key: string, value: any): void {
    if (key) {
      this.parameters[key.toLowerCase()] = (typeof value === "undefined" || value === null) ? null : value.toString();
    }
  }

  public getParam(key: string): string | undefined {
    if (key) {
      return this.parameters[key.toLowerCase()];
    }
  }

  public hasParam(key: string): boolean {
    if (key) {
      // eslint-disable-next-line no-prototype-builtins
      return !!this.parameters.hasOwnProperty(key.toLowerCase());
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public deleteParam(parameter: string): any {
    parameter = parameter.toLowerCase();
    // eslint-disable-next-line no-prototype-builtins
    if (this.parameters.hasOwnProperty(parameter)) {
      const value = this.parameters[parameter];
      delete this.parameters[parameter];
      return value;
    }
  }

  public clearParams(): void {
    this.parameters = {};
  }
}
