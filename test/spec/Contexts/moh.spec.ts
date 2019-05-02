import { LoggerFactory } from "../../../src/LoggerFactory";
import { SessionDescriptionHandler } from "../../../src/Web/SessionDescriptionHandler";
import { SessionDescriptionHandlerObserver } from "../../../src/Web/SessionDescriptionHandlerObserver";

function makeObserver(): SessionDescriptionHandlerObserver {
  const session = {
    emit: (s: string) => { return; }
  };
  return new SessionDescriptionHandlerObserver(session as any, undefined);
}

xdescribe("MoH", () => {
  let sdh1: SessionDescriptionHandler;
  let sdh2: SessionDescriptionHandler;
  let sdh3: SessionDescriptionHandler;
  let value = 0;

  beforeEach(() => {
    const log = new LoggerFactory();
    const logger = log.getLogger("sdh");
    const constraints = { audio: true, video: false };

    sdh1 = new SessionDescriptionHandler(logger, makeObserver(), { constraints });
    sdh2 = new SessionDescriptionHandler(logger, makeObserver(), { constraints });
    sdh3 = new SessionDescriptionHandler(logger, makeObserver(), { constraints });

    return sdh1.getDescription()
      .then((offer) => sdh2.setDescription(offer.body))
      .then(() => sdh2.getDescription())
      .then((answer) => sdh1.setDescription(answer.body));
  });
  afterEach(() => {
    sdh1.close();
    sdh2.close();
    sdh3.close();
  });

  it("foo", () => {
    return sdh1.getDescription()
      .then((offer) => sdh3.setDescription(offer.body))
      .then(() => sdh3.getDescription())
      .then((answer) => sdh1.setDescription(answer.body))
      .then(() => {
        value++;
        expect(value).toBeGreaterThan(0);
      });
  });
});
