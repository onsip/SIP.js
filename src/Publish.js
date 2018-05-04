"use strict";

/**
 * @fileoverview SIP Publish (SIP Extension for Event State Publication RFC3903)
 */

/**
 * @augments SIP
 * @class Class creating a SIP Publish.
 */
module.exports = function (SIP) {
SIP.Publish = function (ua, target, event, body, options, removeOnClose) {
  this.ua = ua;
  this.options = Object.create(options || Object.prototype);
  this.options.extraHeaders = (options.extraHeaders || []).slice();
  this.options.contentType = (options.contentType || 'text/plain');
  this.options.expires = (options.expires || 3600);

  if (target === undefined || target === null) {
    throw new TypeError('Target necessary for PUBLISH');
  } else {
    this.target = target;
  }

  if (event === undefined || event === null || event === '') {
    throw new TypeError('Event necessary for PUBLISH');
  } else {
    this.event = event;
  }

  if (body === undefined || body === null || body === '') {
    throw new TypeError('Body necessary for PUBLISH');
  } else {
    this.body = body;
  }

  if (removeOnClose === undefined) {
    this.removeOnClose = true;
  } else {
    this.removeOnClose = removeOnClose;
  }

  this.pubRequestBody = this.body;
  this.pubRequestExpires = Number(options.expires);
  this.pubRequestEtag = null;

  this.status = 'init';
  this.timers = {pub_duration: null};
};

SIP.Publish.prototype = Object.create(SIP.EventEmitter.prototype);

/**
 * Publish
 *
 * @param {string} Event body to publish, optional
 *
 */
SIP.Publish.prototype.publish = function(body) {
  // Clean up before the run
  this.pubRequest = null;
  SIP.Timers.clearTimeout(this.timers.pub_duration);

  if (body !== undefined && body !== null && body !== '') {
    // is Inital after Unpublish or Modify request
    this.body = body;
    this.pubRequestBody = this.body;

    if (this.pubRequestExpires === 0) {
      // This is initial request after unpublish
      this.pubRequestExpires = this.options.expires;
    }

  } else {
    // is Refresh request or Initial
    if (this.pubRequestEtag !== null) {
      // This is refresh
      this.pubRequestBody = null;
    } else if (this.status !== 'init') {
      throw new TypeError('Body necessary for PUBLISH');
    }
  }

  if (this.ua.publishers[this.target + this.event] === undefined && this.removeOnClose) {
    this.ua.publishers[this.target + this.event] = this;
  }

  this.sendPublishRequest();
};

/**
 * Unpublish
 *
 */
SIP.Publish.prototype.unpublish = function() {
  // Clean up before the run
  this.pubRequest = null;
  SIP.Timers.clearTimeout(this.timers.pub_duration);

  if (this.pubRequestEtag !== null) {
    this.pubRequestBody = null;
    this.pubRequestExpires = 0;
    this.sendPublishRequest();
  }

  if (this.ua.publishers[this.target + this.event] !== undefined) {
    delete this.ua.publishers[this.target + this.event];
  }
};

/**
 * @private
 *
 */
SIP.Publish.prototype.sendPublishRequest = function() {
  var reqOptions;

  reqOptions = Object.create(this.options || Object.prototype);
  reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();

  reqOptions.extraHeaders.push('Contact: '+ this.ua.contact.toString());
  reqOptions.extraHeaders.push('Event: '+ this.event);
  reqOptions.extraHeaders.push('Expires: '+ this.pubRequestExpires);

  if (this.pubRequestEtag !== null) {
    reqOptions.extraHeaders.push('SIP-If-Match: '+ this.pubRequestEtag);
  }

  if (this.pubRequestBody !== null) {
    reqOptions.body = this.pubRequestBody;
    reqOptions.contentType = this.options.contentType;
  }

  this.pubRequest = new SIP.ClientContext(this.ua, SIP.C.PUBLISH, this.target, reqOptions);

  this.pubRequest.logger = this.ua.getLogger('sip.publish');

  this.pubRequest.receiveResponse = function(response) {this.receivePublishResponse(response);}.bind(this);

  this.status = 'sent';
  this.pubRequest.send();
};

/**
 * @private
 *
 */
SIP.Publish.prototype.receivePublishResponse = function(response) {
  var expires, minExpires,
      cause = SIP.Utils.getReasonPhrase(response.status_code);

  switch(true) {
    case /^1[0-9]{2}$/.test(response.status_code):
      this.emit('publishing', response, cause);
      this.status = 'progress';
      break;

    case /^2[0-9]{2}$/.test(response.status_code):
      if (this.pubRequestExpires !== 0) {
        // if this was not a remove request
        this.emit('published', response, cause);
        this.status = 'published';

        // Set SIP-Etag
        if (response.hasHeader('SIP-ETag')) {
          this.pubRequestEtag = response.getHeader('SIP-ETag');
        } else {
          this.logger.warn('SIP-ETag header missing in a 200-class response to PUBLISH');
        }

        // Update Expire
        if (response.hasHeader('Expires')) {
          expires = Number(response.getHeader('Expires'));
          if (typeof expires === 'number' && expires <= this.pubRequestExpires) {
            this.pubRequestExpires = expires;
          } else {
            this.logger.warn('Bad Expires header in a 200-class response to PUBLISH');
          }
        } else {
          this.logger.warn('Expires header missing in a 200-class response to PUBLISH');
        }

        // Schedule refresh
        this.timers.pub_duration = SIP.Timers.setTimeout(this.publish.bind(this), this.pubRequestExpires * 900);
      } else {
        this.emit('unpublished', response, cause);
        this.status = 'unpublished';
      }

      break;

    case /^412$/.test(response.status_code):
      this.emit('publishing', response, cause);

      // 412 code means no matching ETag - possibly the PUBLISH expired
      // Resubmit as new request, if the current request is not a "remove"

      if (this.pubRequestEtag !== null && this.pubRequestExpires !== 0) {
        this.logger.warn('412 response to PUBLISH, recover in 500ms');
        this.pubRequestEtag = null;
        this.timers.pub_duration = SIP.Timers.setTimeout(function() {this.publish(this.body);}.bind(this), 500);
        this.status = 'recover_412';
      } else {
        this.logger.warn('412 response to PUBLISH, recovery failed');
        this.pubRequestExpires = 0;
        this.emit('publishFailed', response, cause);
        this.emit('unpublished', response, cause);
        this.status = 'failed';
      }

      break;

    case /^423$/.test(response.status_code):
      this.emit('publishing', response, cause);

      // 423 code means we need to adjust the Expires interval up
      if (this.pubRequestExpires !== 0 && response.hasHeader('Min-Expires')) {
        minExpires = Number(response.getHeader('Min-Expires'));
        if (typeof minExpires === 'number' || minExpires > this.pubRequestExpires) {
          this.logger.warn('423 code in response to PUBLISH, adjusting the Expires value and trying to recover in 500ms');
          this.pubRequestExpires = minExpires;
          this.timers.pub_duration = SIP.Timers.setTimeout(function() {this.publish(this.body);}.bind(this), 500);
          this.status = 'recover_423';
        } else {
          this.logger.warn('Bad 423 response Min-Expires header received for PUBLISH');
          this.pubRequestExpires = 0;
          this.emit('publishFailed', response, cause);
          this.emit('unpublished', response, cause);
          this.status = 'failed';
        }
      } else {
        this.logger.warn('423 response to PUBLISH, recovery failed');
        this.pubRequestExpires = 0;
        this.emit('publishFailed', response, cause);
        this.emit('unpublished', response, cause);
        this.status = 'failed';
      }

      break;

    default:
      this.pubRequestExpires = 0;
      this.emit('publishFailed', response, cause);
      this.emit('unpublished', response, cause);
      this.status = 'failed';

      break;
  }

  // Do the cleanup
  if (this.pubRequestExpires === 0) {
    SIP.Timers.clearTimeout(this.timers.pub_duration);

    this.pubRequestBody = null;
    this.pubRequestEtag = null;
  }
};

};
