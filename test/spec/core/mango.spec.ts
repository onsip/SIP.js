import { Grammar, URI } from "../../../lib/grammar/index.js";

describe("Mango URI", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let uri: any;

  const itParses = (property: string, expected: string | number): void => {
    it("parses the " + property, () => {
      expect(uri[property]).toEqual(expected);
    });
  };

  describe("Host that starts with Letter", () => {
    beforeEach(() => {
      const startsWithLetter = "sip:FsuFpQ2sWIHanGDpKi8z@aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
      uri = Grammar.URIParse(startsWithLetter);
    });

    it("produces a SIP.URI", () => {
      expect(uri instanceof URI).toBe(true);
    });

    itParses("scheme", "sip");
    itParses("user", "FsuFpQ2sWIHanGDpKi8z");
    itParses("host", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  });
  describe("Host that starts with Number", () => {
    beforeEach(() => {
      const startsWithNumber = "sip:FsuFpQ2sWIHanGDpKi8z@11111111-2222-3333-4444-555555555555";
      uri = Grammar.URIParse(startsWithNumber);
    });

    it("produces a SIP.URI", () => {
      expect(uri instanceof URI).toBe(true);
    });

    itParses("scheme", "sip");
    itParses("user", "FsuFpQ2sWIHanGDpKi8z");
    itParses("host", "11111111-2222-3333-4444-555555555555");
  });
});
