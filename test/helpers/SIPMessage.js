window.SIPHelper = {
  createResponse: function createResponse(request, statusCode, reasonPhrase, body, contentDisposition) {
    var response = new SIP.IncomingResponse(request.ua);
    var parsed, header, length, idx;

    response.statusCode = statusCode;
    response.reasonPhrase = (reasonPhrase || '').toString();

    // Let's hope we don't actually need a raw string of the response.
    response.data = undefined;

    response.body = (body || 'foo').toString();
    response.setHeader('Content-Type', 'text/plain');
    if (contentDisposition) {
      response.setHeader('Content-Disposition', contentDisposition);
    }

    /*
     * We aren't going to parse a bunch of strings,
     * so just copy the headers over from the request.
     */
    response.method = request.method;
    response.from = request.from;
    response.to = request.to;
    response.callId = request.callId;
    response.cseq = request.cseq;
    response.fromTag = request.from.getParam('tag');
    response.toTag = 'uas-to-tag';
    response.viaBranch = request.branch

    /*
     * In addition to properties, some other headers are
     * deemed "important" by the Session.
     */
    response.setHeader('cseq', request.cseq.toString() + ' ' + request.method);

    // Contact
    parsed = SIP.Grammar.parse(request.getHeader('contact'), 'Contact');
    length = parsed.length;
    for (idx = 0; idx < length; idx++) {
      header = parsed[idx];
      response.addHeader('contact', request.getHeader('contact').substring(header.position, header.offset));
      response.headers['Contact'][response.getHeaders('contact').length - 1].parsed = header.parsed;
    }

    // From/To
    response.setHeader('from', request.getHeader('from'));
    response.setHeader('to', request.getHeader('to'));

    // Transaction ACK
    response.transaction = request.transaction;

    return response;
  }
};
