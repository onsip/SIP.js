/**
 * @param size -
 * @param base -
 * @internal
 */
export function createRandomToken(size: number, base: number = 32): string {
  let token: string = "";
  for (let i = 0; i < size; i++) {
    const r: number = Math.floor(Math.random() * base);
    token += r.toString(base);
  }
  return token;
}

/**
 * @internal
 */
export function newTag(): string {
  return createRandomToken(10);
}

/**
 * @param str -
 * @internal
 */
export function headerize(str: string): string {
  const exceptions: any = {
    "Call-Id": "Call-ID",
    "Cseq": "CSeq",
    "Min-Se": "Min-SE",
    "Rack": "RAck",
    "Rseq": "RSeq",
    "Www-Authenticate": "WWW-Authenticate",
  };
  const name: Array<string> = str.toLowerCase().replace(/_/g, "-").split("-");
  const parts: number = name.length;
  let hname: string = "";

  for (let part = 0; part < parts; part++) {
    if (part !== 0) {
      hname += "-";
    }
    hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
  }
  if (exceptions[hname]) {
    hname = exceptions[hname];
  }
  return hname;
}

/**
 * @param str -
 * @internal
 */
export function str_utf8_length(str: string): number {
  return encodeURIComponent(str).replace(/%[A-F\d]{2}/g, "U").length;
}
