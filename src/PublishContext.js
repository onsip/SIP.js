"use strict";

/**
 * @fileoverview SIP Publish (SIP Extension for Event State Publication RFC3903)
 */

/**
 * @augments SIP
 * @class Class creating a SIP PublishContext.
 */
module.exports = function (SIP) {

var PublishContext;

PublishContext = function (ua, target, event, options) {
  this.ua = ua;

  this.logger = this.ua.getLogger('sip.publish');

  this.options = options = (options || {});
  this.options.extraHeaders = (options.extraHeaders || []).slice();
  this.options.contentType = (options.contentType || 'text/plain');

  if (typeof options.expires !== 'number' || (options.expires%1) !== 0 ) {
    this.options.expires = 3600;
    this.logger.warn('Expires must be a number. Using default of 3600');
  } else {
    this.options.expires = options.expires;
  }

  if (typeof(options.removeOnClose) !== "boolean") {
    this.options.removeOnClose = true;
  } else {
    this.options.removeOnClose = options.removeOnClose;
  }

  if (target === undefined || target === null || target === '') {
    throw new SIP.Exceptions.MethodParameterError('Publish','Target',target);
  } else {
    this.target = target;
  }

  if (event === undefined || event === null || event === '') {
    throw new SIP.Exceptions.MethodParameterError('Publish','Event',event);
  } else {
    this.event = event;
  }

  this.body = null;

  this.pubRequest = null;

  this.pubRequestBody = null;
  this.pubRequestExpires = Number(options.expires);
  this.pubRequestEtag = null;

  this.publish_refresh_timer = null;
};

PublishContext.prototype = Object.create(SIP.EventEmitter.prototype);

/**
 * Publish
 *
 * @param {string} Event body to publish, optional
 *
 */
PublishContext.prototype.publish = function(body) {
    // Clean up before the run
    this.pubRequest = null;
    SIP.Timers.clearTimeout(this.publish_refresh_timer);

    if (body !== undefined && body !== null && body !== '') {
      // is Inital or Modify request
      this.body = body;
      this.pubRequestBody = this.body;

      if (this.pubRequestExpires === 0) {
        // This is Initial request after unpublish
        this.pubRequestExpires = this.options.expires;
        this.pubRequestEtag = null;
      }

      if (!(this.ua.publishers[this.target+':'+this.event])) {
        this.ua.publishers[this.target+':'+this.event] = this;
      }

    } else {
      // This is Refresh request
      this.pubRequestBody = null;

      if (this.pubRequestEtag === null) {
        //Request not valid
        throw new SIP.Exceptions.MethodParameterError('Publish', 'Body', body);
      }
    }

    this.sendPublishRequest();
};

/**
 * Unpublish
 *
 */
PublishContext.prototype.unpublish = function() {
    // Clean up before the run
    this.pubRequest = null;
    SIP.Timers.clearTimeout(this.publish_refresh_timer);

    if (this.pubRequestEtag !== null) {
      this.pubRequestBody = null;
      this.pubRequestExpires = 0;
      this.sendPublishRequest();
    }
};

/**
 * Close
 *
 */
PublishContext.prototype.close = function() {

    // Unpublish, if requested
    if (this.options.removeOnClose) {
      this.unpublish();
    }

    if (this.ua.publishers[this.target+':'+this.event]) {
      delete this.ua.publishers[this.target+':'+this.event];
    }
};

/**
 * @private
 *
 */
PublishContext.prototype.sendPublishRequest =  function() {
    var reqOptions;

    reqOptions = Object.create(this.options || Object.prototype);
    reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();

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

    this.pubRequest.receiveResponse = function(response) {this.receivePublishResponse(response);}.bind(this);

    this.pubRequest.send();
};

/**
 * @private
 *
 */
PublishContext.prototype.receivePublishResponse = function(response) {
    var expires, minExpires,
        cause = SIP.Utils.getReasonPhrase(response.status_code);

    switch(true) {
      case /^1[0-9]{2}$/.test(response.status_code):
        this.emit('progress', response, cause);
        break;

      case /^2[0-9]{2}$/.test(response.status_code):
        // Set SIP-Etag
        if (response.hasHeader('SIP-ETag')) {
          this.pubRequestEtag = response.getHeader('SIP-ETag');
        } else {
          this.logger.warn('SIP-ETag header missing in a 200-class response to PUBLISH');
        }

        // Update Expire
        if (response.hasHeader('Expires')) {
          expires = Number(response.getHeader('Expires'));
          if (typeof expires === 'number' && expires >= 0 && expires <= this.pubRequestExpires) {
            this.pubRequestExpires = expires;
          } else {
            this.logger.warn('Bad Expires header in a 200-class response to PUBLISH');
          }
        } else {
          this.logger.warn('Expires header missing in a 200-class response to PUBLISH');
        }

        if (this.pubRequestExpires !== 0) {
          // Schedule refresh
          this.publish_refresh_timer = SIP.Timers.setTimeout(this.publish.bind(this), this.pubRequestExpires * 900);
          this.emit('published', response, cause);
        } else {
          this.emit('unpublished', response, cause);
        }

        break;

      case /^412$/.test(response.status_code):
        // 412 code means no matching ETag - possibly the PUBLISH expired
        // Resubmit as new request, if the current request is not a "remove"

        if (this.pubRequestEtag !== null && this.pubRequestExpires !== 0) {
          this.logger.warn('412 response to PUBLISH, recovering');
          this.pubRequestEtag = null;
          this.emit('progress', response, cause);
          this.publish(this.body);
        } else {
          this.logger.warn('412 response to PUBLISH, recovery failed');
          this.pubRequestExpires = 0;
          this.emit('failed', response, cause);
          this.emit('unpublished', response, cause);
        }

        break;

      case /^423$/.test(response.status_code):
        // 423 code means we need to adjust the Expires interval up
        if (this.pubRequestExpires !== 0 && response.hasHeader('Min-Expires')) {
          minExpires = Number(response.getHeader('Min-Expires'));
          if (typeof minExpires === 'number' || minExpires > this.pubRequestExpires) {
            this.logger.warn('423 code in response to PUBLISH, adjusting the Expires value and trying to recover');
            this.pubRequestExpires = minExpires;
            this.emit('progress', response, cause);
            this.publish(this.body);
          } else {
            this.logger.warn('Bad 423 response Min-Expires header received for PUBLISH');
            this.pubRequestExpires = 0;
            this.emit('failed', response, cause);
            this.emit('unpublished', response, cause);
          }
        } else {
          this.logger.warn('423 response to PUBLISH, recovery failed');
          this.pubRequestExpires = 0;
          this.emit('failed', response, cause);
          this.emit('unpublished', response, cause);
        }

        break;

      default:
        this.pubRequestExpires = 0;
        this.emit('failed', response, cause);
        this.emit('unpublished', response, cause);

        break;
    }

    // Do the cleanup
    if (this.pubRequestExpires === 0) {
      SIP.Timers.clearTimeout(this.publish_refresh_timer);

      this.pubRequestBody = null;
      this.pubRequestEtag = null;
    }
};

SIP.PublishContext = PublishContext;
};
