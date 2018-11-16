// This is apparently EventEmitter from the "events" node module?
// Or perhaps a copy of it? Same interface it seems.

export class EventEmitter {

  constructor();

  addListener(type: string, listener: any): void;

  emit(type: string, ...restOfEvent: any[])

  on(type: string, listener: (...any) => void): void;

  once(type: string, listener: any): void;

  removeListener(type: string, callback: any): void;

  removeAllListeners(type: string): void;

}
