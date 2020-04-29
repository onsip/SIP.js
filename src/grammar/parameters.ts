/**
 * @internal
 */
export class Parameters {
  public parameters: {[name: string]: string} = {};

  constructor(parameters: {[name: string]: string}) {
    for (const param in parameters) {
      if (parameters.hasOwnProperty(param)) {
        this.setParam(param, parameters[param]);
      }
    }
  }

  public setParam(key: string, value: any): void {
    if (key) {
      this.parameters[key.toLowerCase()] = (typeof value === "undefined" || value === null) ? null : value.toString();
    }
  }

  public getParam(key: string) {
    if (key) {
      return this.parameters[key.toLowerCase()];
    }
  }

  public hasParam(key: string): boolean {
    if (key) {
      return !!this.parameters.hasOwnProperty(key.toLowerCase());
    }
    return false;
  }

  public deleteParam(parameter: string): any {
    parameter = parameter.toLowerCase();
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
