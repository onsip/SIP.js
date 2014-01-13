(function (SIP) {

// Load dependencies
var Request         = @@include('../src/Session/Request.js')
var RTCMediaHandler = @@include('../src/Session/RTCMediaHandler.js')
var DTMF            = @@include('../src/Session/DTMF.js')

var Session, InviteServerContext, InviteClientContext,
 C = {
    //Session states
    STATUS_NULL:                        0,
    STATUS_INVITE_SENT:                 1,
    STATUS_1XX_RECEIVED:                2,
    STATUS_INVITE_RECEIVED:             3,
    STATUS_WAITING_FOR_ANSWER:          4,
    STATUS_ANSWERED:                    5,
    STATUS_WAITING_FOR_PRACK:           6,
    STATUS_WAITING_FOR_ACK:             7,
    STATUS_CANCELED:                    8,
    STATUS_TERMINATED:                  9,
    STATUS_ANSWERED_WAITING_FOR_PRACK: 10,
    STATUS_EARLY_MEDIA:                11,
    STATUS_CONFIRMED:                  12
  };

Session = function() {
  var events = [
  'connecting',
  'terminated',
  'dtmf',
  'invite',
  'preaccepted',
  'canceled',
  'referred',
  'bye',
  'hold',
  'unhold',
  'muted',
  'unmuted'
  ];

  this.status = C.STATUS_NULL;
  this.dialog = null;
  this.earlyDialogs = {};
  this.rtcMediaHandler = null;
  this.mediaStream = null;

  // Session Timers
  this.timers = {
    ackTimer: null,
    expiresTimer: null,
    invite2xxTimer: null,
    userNoAnswerTimer: null,
    rel1xxTimer: null,
    prackTimer: null
  };

  // Session info
  this.startTime = null;
  this.endTime = null;
  this.tones = null;

  // Mute/Hold state
  this.audioMuted = false;
  this.videoMuted = false;
  this.local_hold = false;
  this.remote_hold = false;

  this.pending_actions = {
    actions: [],
     
    length: function() {
      return this.actions.length;
    },
     
    isPending: function(name){
      var 
      idx = 0,
      length = this.actions.length;
         
      for (idx; idx<length; idx++) {
        if (this.actions[idx].name === name) {
          return true;
        }
      }
      return false;
    },
     
    shift: function() {
      return this.actions.shift();
    },
     
    push: function(name) {
      this.actions.push({
        name: name
      });
    },
     
    pop: function(name) {
      var 
      idx = 0,
      length = this.actions.length;

      for (idx; idx<length; idx++) {
        if (this.actions[idx].name === name) {
          this.actions.splice(idx,1);
          length --;
          idx--;
        }
      }
    }
   };

  this.media_constraints = {'audio':true, 'video':true};
  this.early_sdp = null;
  this.rel100 = SIP.C.supported.UNSUPPORTED;

  this.initMoreEvents(events);
};

Session.prototype = {
  sendDTMF: function(tones, options) {
    var duration, interToneGap,
      position = 0,
      self = this;

    options = options || {};
    duration = options.duration || null;
    interToneGap = options.interToneGap || null;

    if (tones === undefined) {
      throw new TypeError('Not enough arguments');
    }

    // Check Session Status
    if (this.status !== C.STATUS_CONFIRMED && this.status !== C.STATUS_WAITING_FOR_ACK) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    // Check tones
    if (!tones || (typeof tones !== 'string' && typeof tones !== 'number') || !tones.toString().match(/^[0-9A-D#*,]+$/i)) {
      throw new TypeError('Invalid tones: '+ tones);
    }

    tones = tones.toString();

    // Check duration
    if (duration && !SIP.Utils.isDecimal(duration)) {
      throw new TypeError('Invalid tone duration: '+ duration);
    } else if (!duration) {
      duration = DTMF.C.DEFAULT_DURATION;
    } else if (duration < DTMF.C.MIN_DURATION) {
      this.logger.warn('"duration" value is lower than the minimum allowed, setting it to '+ DTMF.C.MIN_DURATION+ ' milliseconds');
      duration = DTMF.C.MIN_DURATION;
    } else if (duration > DTMF.C.MAX_DURATION) {
      this.logger.warn('"duration" value is greater than the maximum allowed, setting it to '+ DTMF.C.MAX_DURATION +' milliseconds');
      duration = DTMF.C.MAX_DURATION;
    } else {
      duration = Math.abs(duration);
    }
    options.duration = duration;

    // Check interToneGap
    if (interToneGap && !SIP.Utils.isDecimal(interToneGap)) {
      throw new TypeError('Invalid interToneGap: '+ interToneGap);
    } else if (!interToneGap) {
      interToneGap = DTMF.C.DEFAULT_INTER_TONE_GAP;
    } else if (interToneGap < DTMF.C.MIN_INTER_TONE_GAP) {
      this.logger.warn('"interToneGap" value is lower than the minimum allowed, setting it to '+ DTMF.C.MIN_INTER_TONE_GAP +' milliseconds');
      interToneGap = DTMF.C.MIN_INTER_TONE_GAP;
    } else {
      interToneGap = Math.abs(interToneGap);
    }

    if (this.tones) {
      // Tones are already queued, just add to the queue
      this.tones += tones;
      return this;
    }

    // New set of tones to start sending
    this.tones = tones;

    var sendDTMF = function () {
      var tone, timeout,
      tones = self.tones;

      if (self.status === C.STATUS_TERMINATED || !tones || position >= tones.length) {
        // Stop sending DTMF
        self.tones = null;
        return this;
      }

      tone = tones[position];
      position += 1;

      if (tone === ',') {
        timeout = 2000;
      } else {
        var dtmf = new DTMF(self);
        dtmf.on('failed', function(){self.tones = null;});
        dtmf.send(tone, options);
        timeout = duration + interToneGap;
      }

      // Set timeout for the next tone
      window.setTimeout(sendDTMF, timeout);
    };

    // Send the first tone
    sendDTMF();
    return this;
  },

  bye: function(options) {
    options = options || {};

    var
    status_code = options.status_code,
    reason_phrase = options.reason_phrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;

    // Check Session Status
    if (this.status === C.STATUS_TERMINATED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.logger.log('terminating RTCSession');

    reason_phrase = options.reason_phrase || SIP.C.REASON_PHRASE[status_code] || '';

    if (status_code && (status_code < 200 || status_code >= 700)) {
      throw new TypeError('Invalid status_code: '+ status_code);
    } else if (status_code) {
      extraHeaders.push('Reason: SIP ;cause=' + status_code + '; text="' + reason_phrase + '"');
    }

    this.sendRequest(SIP.C.BYE, {
      extraHeaders: extraHeaders,
      body: body
    });

    this.emit('bye', {
      cause: reason_phrase,
      code: status_code
    });
    this.terminated();

    this.close();
  },

  refer: function(target, options) {
    options = options || {};
    var request,
    invalidTarget = false,
    extraHeaders = options.extraHeaders || [],
    self = this;
    if (target === undefined) {
      throw new TypeError('Not enough arguments');
    } else if (target instanceof SIP.InviteServerContext || target instanceof SIP.InviteClientContext) {
      //Attended Transfer
      // B.transfer(C)
      extraHeaders.push('Contact: '+ this.contact);
      extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(this.ua));
      extraHeaders.push('Refer-To: <' + target.dialog.remote_target.toString() + '?Replaces=' + target.dialog.id.call_id + '%3Bto-tag%3D' + target.dialog.id.remote_tag + '%3Bfrom-tag%3D' + target.dialog.id.local_tag + '>');
    } else {
      //Blind Transfer

      // Check Session Status
      if (this.status !== C.STATUS_CONFIRMED) {
        throw new SIP.Exceptions.InvalidStateError(this.status);
      }

      // Check target validity
      try {
        target = SIP.Utils.normalizeTarget(target, this.ua.configuration.hostport_params);
      } catch(e) {
        target = SIP.URI.parse(SIP.INVALID_TARGET_URI);
        invalidTarget = true;
      }

      extraHeaders.push('Contact: '+ this.contact);
      extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(this.ua));
      extraHeaders.push('Refer-To: '+ target);
    }

    //Send the request
    request = new Request(this);
    request.send(SIP.C.REFER, { extraHeaders: extraHeaders });
    request.on('succeeded', function () {
      self.terminate();
    });

    return this;
  },

  sendRequest: function(method, options) {
    var request = new Request(this);

    request.send(method, options);
    return this;
  },

  getLocalStreams: function() {
    return this.rtcMediaHandler &&
      this.rtcMediaHandler.peerConnection &&
      (this.rtcMediaHandler.peerConnection.getLocalStreams &&
       this.rtcMediaHandler.peerConnection.getLocalStreams()) ||
      (this.rtcMediaHandler.peerConnection.localStreams) || [];
  },

  getRemoteStreams: function() {
    return this.rtcMediaHandler &&
      this.rtcMediaHandler.peerConnection &&
      (this.rtcMediaHandler.peerConnection.getRemoteStreams &&
       this.rtcMediaHandler.peerConnection.getRemoteStreams()) ||
      (this.rtcMediaHandler.peerConnection.remoteStreams) || [];
  },

  close: function() {
    var idx;

    if(this.status === C.STATUS_TERMINATED) {
      return this;
    }

    this.logger.log('closing INVITE session ' + this.id);

    // 1st Step. Terminate media.
    if (this.rtcMediaHandler){
      this.rtcMediaHandler.close();
    }

    // 2nd Step. Terminate signaling.

    // Clear session timers
    for(idx in this.timers) {
      window.clearTimeout(this.timers[idx]);
    }

    // Terminate dialogs

    // Terminate confirmed dialog
    if(this.dialog) {
      this.dialog.terminate();
      delete this.dialog;
    }

    // Terminate early dialogs
    for(idx in this.earlyDialogs) {
      this.earlyDialogs[idx].terminate();
      delete this.earlyDialogs[idx];
    }

    this.status = C.STATUS_TERMINATED;

    delete this.ua.sessions[this.id];
    return this;
  },

  createDialog: function(message, type, early) {
    var dialog, early_dialog,
      local_tag = (type === 'UAS') ? message.to_tag : message.from_tag,
      remote_tag = (type === 'UAS') ? message.from_tag : message.to_tag,
      id = message.call_id + local_tag + remote_tag;

    early_dialog = this.earlyDialogs[id];

    // Early Dialog
    if (early) {
      if (early_dialog) {
        return true;
      } else {
        early_dialog = new SIP.Dialog(this, message, type, SIP.Dialog.C.STATUS_EARLY);

        // Dialog has been successfully created.
        if(early_dialog.error) {
          this.logger.error(early_dialog.error);
          this.failed(message, SIP.C.causes.INTERNAL_ERROR);
          return false;
        } else {
          this.earlyDialogs[id] = early_dialog;
          return true;
        }
      }
    }

    // Confirmed Dialog
    else {
      // In case the dialog is in _early_ state, update it
      if (early_dialog) {
        early_dialog.update(message, type);
        this.dialog = early_dialog;
        delete this.earlyDialogs[id];
        for (var dia in this.earlyDialogs) {
          this.earlyDialogs[dia].terminate();
          delete this.earlyDialogs[dia];
        }
        return true;
      }

      // Otherwise, create a _confirmed_ dialog
      dialog = new SIP.Dialog(this, message, type);

      if(dialog.error) {
        this.logger.error(dialog.error);
        this.failed(message, SIP.C.causes.INTERNAL_ERROR);
        return false;
      } else {
        this.to_tag = message.to_tag;
        this.dialog = dialog;
        return true;
      }
    }
  },

  /**
  * Check if Session is ready for a re-INVITE
  *
  * @returns {Boolean} 
  */
  isReadyToReinvite: function() {
    //rtcMediaHandler is not ready
    if (!this.rtcMediaHandler.isReady()) {
      return false;
    }

    // Another INVITE transaction is in progress
    if (this.dialog.uac_pending_reply === true || this.dialog.uas_pending_reply === true) {
      return false;
    }

    return true;
  },

  /**
   * Mute
   */
  mute: function(options) {
    options = options || {
      audio:this.getLocalStreams()[0].getAudioTracks().length > 0, 
      video:this.getLocalStreams()[0].getVideoTracks().length > 0
    };

    var audioMuted = false, 
        videoMuted = false;

    if (this.audioMuted === false && options.audio) {
      audioMuted = true;
      this.audioMuted = true;
      this.toggleMuteAudio(true);
    }

    if (this.videoMuted === false && options.video) {
      videoMuted = true;
      this.videoMuted = true;
      this.toggleMuteVideo(true);
    }

    if (audioMuted === true || videoMuted === true) {
      this.onmute({
        audio: audioMuted,
        video: videoMuted
      });
    }
  },

  /**
   * Unmute
   */
  unmute: function(options) {
    options = options || {
      audio:this.getLocalStreams()[0].getAudioTracks().length > 0, 
      video:this.getLocalStreams()[0].getVideoTracks().length > 0
    };
 
    var audioUnMuted = false, 
        videoUnMuted = false;

    if (this.audioMuted === true && options.audio) {
      audioUnMuted = true;
      this.audioMuted = false;

      if (this.local_hold === false) {
        this.toggleMuteAudio(false);
      }
    }

    if (this.videoMuted === true && options.video) {
      videoUnMuted = true;
      this.videoMuted = false;

      if (this.local_hold === false) {
        this.toggleMuteVideo(false);
      }
    }

    if (audioUnMuted === true || videoUnMuted === true) {
      this.onunmute({
        audio: audioUnMuted,
        video: videoUnMuted
      });
    }
  },

  /**
   * isMuted
   */
  isMuted: function() {
    return {
      audio: this.audioMuted,
      video: this.videoMuted
    };
  },

  /*
   * @private
   */
  toggleMuteAudio: function(mute) {
    var streamIdx, trackIdx, tracks,
        localStreams = this.getLocalStreams();

    for (streamIdx in localStreams) {
      tracks = localStreams[streamIdx].getAudioTracks();
      for (trackIdx in tracks) {
        tracks[trackIdx].enabled = !mute;
      }
    }
  },

  /*
   * @private
   */
  toggleMuteVideo: function(mute) {
    var streamIdx, trackIdx, tracks,
        localStreams = this.getLocalStreams();

    for (streamIdx in localStreams) {
      tracks = localStreams[streamIdx].getVideoTracks();
      for (trackIdx in tracks) {
        tracks[trackIdx].enabled = !mute;
      }
    }
  },

  /**
   * Hold
   */
  hold: function() {

    if (this.status !== C.STATUS_WAITING_FOR_ACK && this.status !== C.STATUS_CONFIRMED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.toggleMuteAudio(true);
    this.toggleMuteVideo(true);

    // Check if RTCSession is ready to send a reINVITE
    if (!this.isReadyToReinvite()) {
      /* If there is a pending 'unhold' action, cancel it and don't queue this one
       * Else, if there isn't any 'hold' action, add this one to the queue
       * Else, if there is already a 'hold' action, skip
       */
      if (this.pending_actions.isPending('unhold')) {
        this.pending_actions.pop('unhold');
      } else if (!this.pending_actions.isPending('hold')) {
        this.pending_actions.push('hold');
      }
      return;
    } else if (this.local_hold === true) {
        return;
    }

    this.onhold('local');

    this.sendReinvite({
      mangle: function(body){
        var idx, length;

        body = SIP.Parser.parseSDP(body);

        length = body.media.length;
        for (idx=0; idx<length; idx++) {
          if (body.media[idx].direction === undefined) {
            body.media[idx].direction = 'sendonly';
          } else if (body.media[idx].direction === 'sendrecv') {
            body.media[idx].direction = 'sendonly';
          } else if (body.media[idx].direction === 'sendonly') {
            body.media[idx].direction = 'inactive';
          }
        }

        return SIP.Parser.writeSDP(body);
      }
    });
  },

  /**
   * Unhold
   */
  unhold: function() {

    if (this.status !== C.STATUS_WAITING_FOR_ACK && this.status !== C.STATUS_CONFIRMED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    if (!this.audioMuted) {
      this.toggleMuteAudio(false);
    }

    if (!this.videoMuted) {
      this.toggleMuteVideo(false);
    }

    if (!this.isReadyToReinvite()) {
      /* If there is a pending 'hold' action, cancel it and don't queue this one
       * Else, if there isn't any 'unhold' action, add this one to the queue
       * Else, if there is already a 'unhold' action, skip
       */
      if (this.pending_actions.isPending('hold')) {
        this.pending_actions.pop('hold');
      } else if (!this.pending_actions.isPending('unhold')) {
        this.pending_actions.push('unhold');
      }
      return;
    } else if (this.local_hold === false) {
      return;
    }

    this.onunhold('local');

    this.sendReinvite();
  },

  /**
   * isOnHold
   */
  isOnHold: function() {
    return {
      local: this.local_hold,
      remote: this.remote_hold
    };
  },

  /**
   * In dialog INVITE Reception
   * @private
   */
  receiveReinvite: function(request) {
    var sdp, idx, direction,
        self = this,
        contentType = request.getHeader('Content-Type'),
        hold = true;

    if (request.body) {
      if (contentType !== 'application/sdp') {
        this.logger.warn('invalid Content-Type');
        request.reply(415);
        return;
      }
     
      sdp = SIP.Parser.parseSDP(request.body);

      for (idx=0; idx < sdp.media.length; idx++) {
        direction = sdp.direction || sdp.media[idx].direction || 'sendrecv';

        if (direction !== 'sendonly' && direction !== 'inactive') {
          hold = false;
        }
      }

      this.rtcMediaHandler.onMessage(
        'offer',
        request.body,
        /*
         * onSuccess
         * SDP Offer is valid
         */
        function() {
          self.rtcMediaHandler.createAnswer(
            function(body) {
              request.reply(200, null, ['Contact: ' + self.contact], body,
                function() {
                  self.status = C.STATUS_WAITING_FOR_ACK;
                  self.setInvite2xxTimer(request, body);
                  self.setACKTimer();

                  if (self.remote_hold === true && hold === false) {
                    self.onunhold('remote');
                  } else if (self.remote_hold === false && hold === true) {
                    self.onhold('remote');
                  }
                });
            },
            function() {
              request.reply(500);
            }
          );
        },
        /*
         * onFailure
         * Bad media description
         */
        function(e) {
          self.logger.error(e);
          request.reply(488);
        }
      );
    }
  },

  sendReinvite: function(options) {
    options = options || {};

    var
      self = this,
       extraHeaders = options.extraHeaders || [],
       eventHandlers = options.eventHandlers || {},
       mangle = options.mangle || null;

    if (eventHandlers.succeeded) {
      this.reinviteSucceeded = eventHandlers.succeeded;
    } else {
      this.reinviteSucceeded = function(){
        window.clearTimeout(self.timers.ackTimer);
        window.clearTimeout(self.timers.invite2xxTimer);
        self.status = C.STATUS_CONFIRMED;
      };
    }
    if (eventHandlers.failed) {
      this.reinviteFailed = eventHandlers.failed;
    } else {
      this.reinviteFailed = function(){};
    }

    extraHeaders.push('Contact: ' + this.contact);
    extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(this.ua));
    extraHeaders.push('Content-Type: application/sdp');

    this.receiveResponse = this.receiveReinviteResponse;

    this.rtcMediaHandler.createOffer(
      function(body){
        if (mangle) {
          body = mangle(body);
        }

        self.dialog.sendRequest(self, SIP.C.INVITE, {
          extraHeaders: extraHeaders,
          body: body
        });
      },
      function() {
        if (self.isReadyToReinvite()) {
          self.onReadyToReinvite();
        }
        self.reinviteFailed();
      }
    );
  },
 
  /**
   * Reception of Response for in-dialog INVITE
   * @private
   */
  receiveReinviteResponse: function(response) {
    var self = this,
        contentType = response.getHeader('Content-Type');

    if (this.status === C.STATUS_TERMINATED) {
      return;
    }

    switch(true) {
      case /^1[0-9]{2}$/.test(response.status_code):
        break;
      case /^2[0-9]{2}$/.test(response.status_code):
        this.status = C.STATUS_CONFIRMED;
        this.sendRequest(SIP.C.ACK);

        if(!response.body) {
          this.reinviteFailed();
          break;
        } else if (contentType !== 'application/sdp') {
          this.reinviteFailed();
          break;
        }

        this.rtcMediaHandler.onMessage(
          'answer',
          response.body,
          /*
           * onSuccess
           * SDP Answer fits with Offer.
           */
          function() {
            self.reinviteSucceeded();
          },
          /*
           * onFailure
           * SDP Answer does not fit the Offer.
           */
          function() {
            self.reinviteFailed();
          }
        );
        break;
      default:
        this.reinviteFailed();
    }
  },

  acceptAndTerminate: function(response, status_code, reason_phrase) {
    var extraHeaders = [];

    if (status_code) {
      reason_phrase = reason_phrase || SIP.C.REASON_PHRASE[status_code] || '';
      extraHeaders.push('Reason: SIP ;cause=' + status_code + '; text="' + reason_phrase + '"');
    }

    // An error on dialog creation will fire 'failed' event
    if (this.dialog || this.createDialog(response, 'UAC')) {
      this.sendRequest(SIP.C.ACK);
      this.sendRequest(SIP.C.BYE, {
        extraHeaders: extraHeaders
      });
    }

    return this;
  },

  /**
   * RFC3261 13.3.1.4
   * Response retransmissions cannot be accomplished by transaction layer
   *  since it is destroyed when receiving the first 2xx answer
   */
  setInvite2xxTimer: function(request, body) {
    var self = this,
        timeout = SIP.Timers.T1;

    this.timers.invite2xxTimer = window.setTimeout(function invite2xxRetransmission() {
      if (self.status !== C.STATUS_WAITING_FOR_ACK) {
        return;
      }

      request.reply(200, null, ['Contact: ' + self.contact], body);

      if (timeout < SIP.Timers.T2) {
        timeout = timeout * 2;
        if (timeout > SIP.Timers.T2) {
          timeout = SIP.Timers.T2;
        }
      }
      self.timers.invite2xxTimer = window.setTimeout(
        invite2xxRetransmission, timeout
      );
    }, timeout);
  },

  /**
   * RFC3261 14.2
   * If a UAS generates a 2xx response and never receives an ACK,
   *  it SHOULD generate a BYE to terminate the dialog.
   */
  setACKTimer: function() {
    var self = this;

    this.timers.ackTimer = window.setTimeout(function() {
      if(self.status === C.STATUS_WAITING_FOR_ACK) {
        self.logger.log('no ACK received, terminating the call');
        window.clearTimeout(self.timers.invite2xxTimer);
        self.sendRequest(SIP.C.BYE);
        self.terminated(null, SIP.C.causes.NO_ACK);
      }
    }, SIP.Timers.TIMER_H);
  },

  /*
   * @private
   */
  onReadyToReinvite: function() {
    var action = (this.pending_actions.length() > 0)? this.pending_actions.shift() : null;

    if (!action) {
      return;
    }

    if (action.name === 'hold') {
      this.hold();
    } else if (action.name === 'unhold') {
      this.unhold();
    }
  },

  onTransportError: function() {
    if(this.status !== C.STATUS_TERMINATED) {
      if (this.status === C.STATUS_CONFIRMED) {
        this.terminated(null, SIP.C.causes.CONNECTION_ERROR);
      } else {
        this.failed(null, SIP.C.causes.CONNECTION_ERROR);
      }
    }
  },

  onRequestTimeout: function() {
    if(this.status !== C.STATUS_TERMINATED) {
      if (this.status === C.STATUS_CONFIRMED) {
        this.terminated(null, SIP.C.causes.REQUEST_TIMEOUT);
      } else {
        this.failed(null, SIP.C.causes.REQUEST_TIMEOUT);
      }
    }
  },

  onDialogError: function(response) {
    if(this.status !== C.STATUS_TERMINATED) {
      if (this.status === C.STATUS_CONFIRMED) {
        this.terminated(response, SIP.C.causes.DIALOG_ERROR);
      } else {
        this.failed(response, SIP.C.causes.DIALOG_ERROR);
      }
    }
  },

  /**
   * @private
   */
  onhold: function(originator) {
    if (originator === 'local') {
      this.local_hold = true;
    } else {
      this.remote_hold = true;
    }
   
    this.emit('hold', {
      originator: originator
    });
  },

  /**
   * @private
   */
  onunhold: function(originator) {
    if (originator === 'local') {
      this.local_hold = false;
    } else {
      this.remote_hold = false;
    }

    this.emit('unhold', {
      originator: originator
    });
  },

  /*
   * @private
   */
  onmute: function(options) {
    this.emit('muted', {
      audio: options.audio,
      video: options.video
    });
  },

  /*
   * @private
   */
  onunmute: function(options) {
    this.emit('unmuted', {
      audio: options.audio,
      video: options.video
    });
  },

  failed: function(response, cause) {
    var code = response ? response.status_code : null;

    this.close();
    this.emit('failed', {
      response: response || null,
      cause: cause,
      code: code
    });

    return this;
  },

  rejected: function(response, cause) {
    var code = response ? response.status_code : null;

    this.close();
    this.emit('rejected', {
      response: response || null,
      cause: cause,
      code: code
    });

    return this;
  },

  referred: function(context) {
    this.emit('referred', {
      context: context || null
    });

    return this;
  },

  canceled: function(response) {
    var code = response ? response.status_code : null;

    this.close();
    this.emit('canceled', {
      response: response || null,
      code: code
    });

    return this;
  },

  accepted: function(response) {
    var code = response ? response.status_code : null;

    this.startTime = new Date();

    this.emit('accepted', {
      code: code,
      response: response || null
    });

    return this;
  },

  terminated: function(message, cause) {
    this.endTime = new Date();

    this.close();
    this.emit('terminated', {
      message: message || null,
      cause: cause || null
    });

    return this;
  },

  connecting: function(request) {
    this.emit('connecting', {
      request: request
    });
  }
};

Session.C = C;
SIP.Session = Session;


InviteServerContext = function(ua, request) {
  var expires,
    self = this,
    contentType = request.getHeader('Content-Type');

  this.contentDisp = request.getHeader('Content-Disposition');

  // Check body and content type
  if (request.body && contentType !== 'application/sdp') {
    if (this.contentDisp === 'session') {
      request.reply(415);
      return;
    } else {
      this.contentDisp = 'render';
    }
  }
  else if (window.mozRTCPeerConnection !== undefined) {
    request.body = request.body.replace(/relay/g,"host generation 0");
    request.body = request.body.replace(/ \r\n/g, "\r\n");
  }

  SIP.Utils.augment(this, SIP.ServerContext, [ua, request]);
  SIP.Utils.augment(this, SIP.Session, []);

  this.status = C.STATUS_INVITE_RECEIVED;
  this.from_tag = request.from_tag;
  this.id = request.call_id + this.from_tag;
  this.request = request;
  this.contact = this.ua.contact.toString();

  this.logger = ua.getLogger('sip.inviteservercontext', this.id);

  //Save the session into the ua sessions collection.
  this.ua.sessions[this.id] = this;

  //Get the Expires header value if exists
  if(request.hasHeader('expires')) {
    expires = request.getHeader('expires') * 1000;
  }

  //Set 100rel if necessary
  if (request.hasHeader('require') && request.getHeader('require').toLowerCase().indexOf('100rel') >= 0) {
    this.rel100 = SIP.C.supported.REQUIRED;
  }
  if (request.hasHeader('supported') && request.getHeader('supported').toLowerCase().indexOf('100rel') >= 0) {
    this.rel100 = SIP.C.supported.SUPPORTED;
  }

  /* Set the to_tag before
   * replying a response code that will create a dialog.
   */
  request.to_tag = SIP.Utils.newTag();

  // An error on dialog creation will fire 'failed' event
  if(!this.createDialog(request, 'UAS', true)) {
    request.reply(500, 'Missing Contact header field');
    return;
  }

  //Initialize Media Session
  this.rtcMediaHandler = new RTCMediaHandler(this, {
    RTCConstraints: {"optional": [{'DtlsSrtpKeyAgreement': 'true'}]}    
  });

  function fireNewSession() {
    var options = {extraHeaders: ['Contact: ' + self.contact]};

    if (self.rel100 !== SIP.C.supported.REQUIRED) {
      self.progress(options);
    }
    self.status = C.STATUS_WAITING_FOR_ANSWER;

    // Set userNoAnswerTimer
    self.timers.userNoAnswerTimer = window.setTimeout(function() {
      request.reply(408);
      self.failed(request, SIP.C.causes.NO_ANSWER);
    }, self.ua.configuration.no_answer_timeout);

    /* Set expiresTimer
     * RFC3261 13.3.1
     */
    if (expires) {
      self.timers.expiresTimer = window.setTimeout(function() {
        if(self.status === C.STATUS_WAITING_FOR_ANSWER) {
          request.reply(487);
          self.failed(request, SIP.C.causes.EXPIRES);
        }
      }, expires);
    }

    self.emit('invite');
  }

  if (!request.body || this.contentDisp === 'render') {
    fireNewSession();
  } else {
    this.rtcMediaHandler.onMessage(
      'offer',
      request.body,
      /*
       * onSuccess
       * SDP Offer is valid. Fire UA newRTCSession
       */
      fireNewSession,
      /*
       * onFailure
       * Bad media description
       */
      function(e) {
        self.logger.warn('invalid SDP');
        self.logger.warn(e);
        request.reply(488);
      }
    );
  }
};

InviteServerContext.prototype = {
  reject: function(options) {
    options = options || {};

    var
    status_code = options.status_code,
    reason_phrase = options.reason_phrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body;
   
    // Check Session Status
    if (this.status === C.STATUS_TERMINATED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.logger.log('rejecting RTCSession');

    status_code = status_code || 480;

    if (status_code < 300 || status_code >= 700) {
      throw new TypeError('Invalid status_code: '+ status_code);
    }

    this.request.reply(status_code, reason_phrase, extraHeaders, body);
    this.failed(null, SIP.C.causes.REJECTED);
    this.rejected(null, reason_phrase);
    this.terminated();

    this.close();

    return this;
  },

  terminate: function(options) {
    options = options || {};

    var
    status_code = options.status_code,
    reason_phrase = options.reason_phrase,
    extraHeaders = options.extraHeaders || [],
    body = options.body,
    dialog,
    self = this;

    if (this.status === C.STATUS_WAITING_FOR_ACK &&
       this.request.server_transaction.state !== SIP.Transactions.C.STATUS_TERMINATED) {
      dialog = this.dialog;
      
      this.receiveRequest = function(request) {
        if (request.method === SIP.C.ACK) {
          this.request(SIP.C.BYE, {
            extraHeaders: extraHeaders,
            body: body
          });
          dialog.terminate();
        }
      };

      this.request.server_transaction.on('stateChanged', function(){
        if (this.state === SIP.Transactions.C.STATUS_TERMINATED) {
          self.sendRequest(SIP.C.BYE, {
            extraHeaders: extraHeaders,
            body: body
          });
          dialog.terminate();
        }
      });

      this.emit('bye', {
        cause: reason_phrase,
        code: status_code
      });
      this.terminated();

      // Restore the dialog into 'this' in order to be able to send the in-dialog BYE :-)
      this.dialog = dialog;

      // Restore the dialog into 'ua' so the ACK can reach 'this' session
      this.ua.dialogs[dialog.id.toString()] = dialog;
      
    } else if (this.status === C.STATUS_CONFIRMED) {
      this.bye(options);
    } else {
      this.reject(options);
    }

    return this;
  },

  preaccept: function(options) {
    options = options || {};
    var self = this;

    if (this.rel100 === SIP.C.supported.UNSUPPORTED) {
      return this;
    }
    self.status = C.STATUS_WAITING_FOR_PRACK;
    var extraHeaders = [];
    extraHeaders.push('Contact: '+ this.contact);
    extraHeaders.push('Require: 100rel');

    var
    sdpCreationSucceeded = function(offer) {
      if (self.isCanceled || self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.early_sdp = offer;
      var rseq = Math.floor(Math.random() * 10000);
      var timeout =  SIP.Timers.T1;

      self.timers.rel1xxTimer = window.setTimeout(function rel1xxRetransmission(rseq) {
        extraHeaders.push('RSeq: '+ rseq);
        self.request.reply(183,null,extraHeaders,offer);
        extraHeaders.pop();
        timeout = timeout * 2;
        self.timers.rel1xxTimer = window.setTimeout(
          rel1xxRetransmission,timeout, rseq
        );
      }, timeout,rseq);

      self.timers.prackTimer = window.setTimeout(function () {
        if(self.status === C.STATUS_WAITING_FOR_PRACK) {
          self.logger.log('no ACK received, terminating the call');
          window.clearTimeout(self.timers.rel1xxTimer);
          self.request.reply(504);
          self.terminated(null, SIP.C.causes.NO_PRACK);
        }
      },SIP.Timers.T1*64);

      self.emit('preaccepted');
    },
    sdpCreationFailed = function () {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }
      self.failed(null, SIP.C.causes.WEBRTC_ERROR);
    },

    // rtcMediaHandler.addStream successfully added
    streamAdditionSucceeded = function() {
      self.connecting();
      if (self.status === C.STATUS_TERMINATED) {
        return;
      } else if (self.request.body && self.contentDisp !== 'render') {
        self.rtcMediaHandler.createAnswer(
          sdpCreationSucceeded,
          sdpCreationFailed
        );
      } else {
        self.rtcMediaHandler.createOffer(
          sdpCreationSucceeded,
          sdpCreationFailed
        );
      }
    },

    // rtcMediaHandler.addStream failed
    streamAdditionFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }
      self.failed(null, SIP.C.causes.WEBRTC_ERROR);
    },

    // User media succeeded
    userMediaSucceeded = function(stream) {
      self.rtcMediaHandler.addStream(
        stream,
        streamAdditionSucceeded,
        streamAdditionFailed
      );
    },

    // User media failed
    userMediaFailed = function() {
      this.request.reply(480);
      self.failed(null, SIP.C.causes.USER_DENIED_MEDIA_ACCESS);
    };

    self.rtcMediaHandler.getUserMedia(
      userMediaSucceeded,
      userMediaFailed,
      self.media_constraints
    );

    return this;
  },

  accept: function(options) {
    options = options || {};

    var idx, length, hasAudio, hasVideo,
      self = this,
      response,
      request = this.request,
      extraHeaders = options.extraHeaders || [],
      mediaStream = options.mediaStream || null,

    // User media succeeded
    userMediaSucceeded = function(stream) {
      self.rtcMediaHandler.addStream(
        stream,
        streamAdditionSucceeded,
        streamAdditionFailed
      );
    },

    // User media failed
    userMediaFailed = function() {
      response = request.reply(480);
      self.failed(response, SIP.C.causes.USER_DENIED_MEDIA_ACCESS);
    },

    // rtcMediaHandler.addStream successfully added
    streamAdditionSucceeded = function() {
      self.connecting(request);
      if (self.status === C.STATUS_TERMINATED) {
        return;
      } else if (request.body && self.contentDisp !== 'render') {
        self.rtcMediaHandler.createAnswer(
          sdpCreationSucceeded,
          sdpCreationFailed
        );
      } else {
        self.rtcMediaHandler.createOffer(
          sdpCreationSucceeded,
          sdpCreationFailed
        );
      }
    },

    // rtcMediaHandler.addStream failed
    streamAdditionFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.failed(null, SIP.C.causes.WEBRTC_ERROR);
    },

    // rtcMediaHandler.createAnswer succeeded
    sdpCreationSucceeded = function(body) {
      var
        // run for reply success callback
        replySucceeded = function() {
          self.status = C.STATUS_WAITING_FOR_ACK;

          self.setInvite2xxTimer(request, body);
          self.setACKTimer();
          if (self.request.body && self.contentDisp !== 'render') {
            self.accepted();
          }
        },

        // run for reply failure callback
        replyFailed = function() {
          self.failed(null, SIP.C.causes.CONNECTION_ERROR);
        };

      extraHeaders.push('Contact: ' + self.contact);

      request.reply(200, null, extraHeaders,
        body,
        replySucceeded,
        replyFailed
      );

    },

    // rtcMediaHandler.createAnsewr failed
    sdpCreationFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.failed(null, SIP.C.causes.WEBRTC_ERROR);
    };


    if (options.mediaConstraints != null) {
      this.media_constraints = options.mediaConstraints;
    }

    // Check Session Status
    if (this.status === C.STATUS_WAITING_FOR_PRACK) {
      this.status = C.STATUS_ANSWERED_WAITING_FOR_PRACK;
      return this;
    } else if (this.status === C.STATUS_WAITING_FOR_ANSWER) {
      this.status = C.STATUS_ANSWERED;
    } else if (this.status !== C.STATUS_EARLY_MEDIA) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    // An error on dialog creation will fire 'failed' event
    if(!this.createDialog(request, 'UAS')) {
      request.reply(500, 'Missing Contact header field');
      return this;
    }

    window.clearTimeout(this.timers.userNoAnswerTimer);

    extraHeaders.unshift('Contact: ' + self.contact);

    length = this.getRemoteStreams().length;

    for (idx = 0; idx < length; idx++) {
      if (this.getRemoteStreams()[idx].getVideoTracks().length > 0) {
        hasVideo = true;
      }
      if (this.getRemoteStreams()[idx].getAudioTracks().length > 0) {
        hasAudio = true;
      }
    }

    if (!hasAudio && this.media_constraints.audio === true) {
      this.media_constraints.audio = false;
      if (mediaStream) {
        length = mediaStream.getAudioTracks().length;
        for (idx = 0; idx < length; idx++) {
          mediaStream.removeTrack(mediaStream.getAudioTracks()[idx]);
        }
      }
    }

    if (!hasVideo && this.media_constraints.video === true) {
      this.media_constraints.video = false;
      if (mediaStream) {
        length = mediaStream.getVideoTracks().length;
        for (idx = 0; idx < length; idx++) {
          mediaStream.removeTrack(mediaStream.getVideoTracks()[idx]);
        }
      }
    }

    if (this.status === C.STATUS_EARLY_MEDIA) {
      sdpCreationSucceeded(self.early_sdp);
    } else {
      this.rtcMediaHandler.getUserMedia(
        userMediaSucceeded,
        userMediaFailed,
        this.media_constraints
      );
    }
    return this;
  },

  receiveRequest: function(request) {
    var contentType, session = this, localMedia, referSession;

    function confirmSession() {
      localMedia = session.rtcMediaHandler.localMedia;
      window.clearTimeout(session.timers.ackTimer);
      window.clearTimeout(session.timers.invite2xxTimer);
      session.status = C.STATUS_CONFIRMED;
      if (localMedia.getAudioTracks().length > 0) {
        localMedia.getAudioTracks()[0].enabled = true;
      }
      if (localMedia.getVideoTracks().length > 0) {
        localMedia.getVideoTracks()[0].enabled = true;
      }
      if (!session.request.body || session.contentDisp === 'render') {
        session.accepted();
        //custom data will be here
        session.renderbody = session.request.body;
        session.rendertype = session.request.getHeader('Content-type');
      } else if (contentType !== 'application/sdp') {
        //custom data will be here
        session.renderbody = request.body;
        session.rendertype = request.getHeader('Content-type');
      }
    }

    if(request.method === SIP.C.CANCEL) {
      /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
       * was in progress and that the UAC MAY continue with the session established by
       * any 2xx response, or MAY terminate with BYE. SIP does continue with the
       * established session. So the CANCEL is processed only if the session is not yet
       * established.
       */

      /*
       * Terminate the whole session in case the user didn't accept (or yet to send the answer) nor reject the
       *request opening the session.
       */
      if(this.status === C.STATUS_WAITING_FOR_ANSWER || this.status === C.STATUS_WAITING_FOR_PRACK || this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK || this.status === C.STATUS_EARLY_MEDIA || this.status === C.STATUS_ANSWERED) {
        if (this.status === C.STATUS_WAITING_FOR_PRACK || this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
          window.clearTimeout(session.timers.rel1xxTimer);
          window.clearTimeout(session.timers.prackTimer);
        }
        this.status = C.STATUS_CANCELED;
        this.request.reply(487);
        this.canceled(request);
        this.failed(request, SIP.C.causes.CANCELED);
        this.terminated(request);
      }
    } else {
      // Requests arriving here are in-dialog requests.
      switch(request.method) {
        case SIP.C.ACK:
          if(this.status === C.STATUS_WAITING_FOR_ACK) {
            if (!this.request.body || this.contentDisp === 'render') {
              if(request.body && request.getHeader('content-type') === 'application/sdp') {
                // ACK contains answer to an INVITE w/o SDP negotiation
                this.rtcMediaHandler.onMessage(
                  'answer',
                  request.body,
                  /*
                   * onSuccess
                   * SDP Answer fits with Offer. Media will start
                   */
                  confirmSession,
                  /*
                   * onFailure
                   * SDP Answer does not fit the Offer.  Terminate the call.
                   */
                  function (e) {
                    session.logger.warn(e);
                    session.terminate({
                      status_code: '488',
                      reason_phrase: 'Bad Media Description'
                    });
                    session.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  }
                );
              } else if (session.early_sdp) {
                confirmSession();
              } else {
                session.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              }
            } else {
              confirmSession();
            }
          }
          break;
        case SIP.C.PRACK:
          if (this.status === C.STATUS_WAITING_FOR_PRACK || this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
            localMedia = session.rtcMediaHandler.localMedia;
            if(!this.request.body) {
              if(request.body && request.getHeader('content-type') === 'application/sdp') {
                this.rtcMediaHandler.onMessage(
                  'answer',
                  request.body,
                  /*
                   * onSuccess
                   * SDP Answer fits with Offer. Media will start
                   */
                  function() {
                    window.clearTimeout(session.timers.rel1xxTimer);
                    window.clearTimeout(session.timers.prackTimer);
                    request.reply(200);
                    if (session.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                      session.status = C.STATUS_EARLY_MEDIA;
                      session.accept();
                    }
                    session.status = C.STATUS_EARLY_MEDIA;
                    if (localMedia.getAudioTracks().length > 0) {
                      localMedia.getAudioTracks()[0].enabled = false;
                    }
                    if (localMedia.getVideoTracks().length > 0) {
                      localMedia.getVideoTracks()[0].enabled = false;
                    }
                  },
                  function (e) {
                    session.logger.warn(e);
                    session.terminate({
                      status_code: '488',
                      reason_phrase: 'Bad Media Description'
                    });
                    session.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
                  }
                );
              } else {
                session.terminate({
                  status_code: '488',
                  reason_phrase: 'Bad Media Description'
                });
                session.failed(request, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              }
            } else {
              window.clearTimeout(session.timers.rel1xxTimer);
              window.clearTimeout(session.timers.prackTimer);
              request.reply(200);
              
              if (this.status === C.STATUS_ANSWERED_WAITING_FOR_PRACK) {
                this.status = C.STATUS_EARLY_MEDIA;
                this.accept();
              }
              this.status = C.STATUS_EARLY_MEDIA;
              localMedia = session.rtcMediaHandler.localMedia;
              if (localMedia.getAudioTracks().length > 0) {
                localMedia.getAudioTracks()[0].enabled = false;
              }
              if (localMedia.getVideoTracks().length > 0) {
                localMedia.getVideoTracks()[0].enabled = false;
              }
            }
          }
          break;
        case SIP.C.BYE:
          if(this.status === C.STATUS_CONFIRMED) {
            request.reply(200);
            this.bye();
            this.terminated(request, SIP.C.causes.BYE);
          }
          break;
        case SIP.C.INVITE:
          if(this.status === C.STATUS_CONFIRMED) {
            this.logger.log('re-INVITE received');
            this.receiveReinvite(request);
          }
          break;
        case SIP.C.INFO:
          if(this.status === C.STATUS_CONFIRMED || this.status === C.STATUS_WAITING_FOR_ACK) {
            contentType = request.getHeader('content-type');
            if (contentType && (contentType.match(/^application\/dtmf-relay/i))) {
              new DTMF(this).init_incoming(request);
            }
          }
          break;
        case SIP.C.REFER:
          if(this.status ===  C.STATUS_CONFIRMED) {
            this.logger.log('REFER received');
            request.reply(202, 'Accepted');

            (new Request(this)).send(SIP.C.NOTIFY, {
              extraHeaders: [
                'Event: refer',
                'Subscription-State: terminated',
                'Content-Type: message/sipfrag'
              ],
              body: 'SIP/2.0 100 Trying'
            });

            /*
              Harmless race condition.  Both sides of REFER
              may send a BYE, but in the end the dialogs are destroyed.
            */
            referSession = this.ua.invite(request.parseHeader('refer-to').uri, {
              mediaConstraints: this.media_constraints
            });

            this.referred(referSession);

            this.terminate();
          }
          break;
      }
    }
  }

};

SIP.InviteServerContext = InviteServerContext;

InviteClientContext = function(ua, target, options) {
  options = options || {};
  var requestParams, iceServers,
    extraHeaders = options.extraHeaders || [],
    stun_servers = options.stun_servers || null,
    turn_servers = options.turn_servers || null;

  // Check WebRTC support
  if (!SIP.WebRTC.isSupported) {
    throw new SIP.Exceptions.NotSupportedError('WebRTC not supported');
  }

  this.mediaConstraints = options.mediaConstraints || {audio: true, video: true},
  this.RTCConstraints = options.RTCConstraints || {},
  this.inviteWithoutSdp = options.inviteWithoutSdp || false;

  // Set anonymous property
  this.anonymous = options.anonymous || false;

  //Custom data to be sent either in INVITE or in ACK
  this.renderbody = options.renderbody || null;
  this.rendertype = options.rendertype || null;

  requestParams = {from_tag: this.from_tag};

  /* Do not add ;ob in initial forming dialog requests if the registration over 
   *  the current connection got a GRUU URI.
   */
  this.contact = ua.contact.toString({
    anonymous: this.anonymous,
    outbound: this.anonymous ? !ua.contact.temp_gruu : !ua.contact.pub_gruu
  });

  if (this.anonymous) {
    requestParams.from_display_name = 'Anonymous';
    requestParams.from_uri = 'sip:anonymous@anonymous.invalid';

    extraHeaders.push('P-Preferred-Identity: '+ ua.configuration.uri.toString());
    extraHeaders.push('Privacy: id');
  }
  extraHeaders.push('Contact: '+ this.contact);
  extraHeaders.push('Allow: '+ SIP.Utils.getAllowedMethods(ua));
  if (!this.inviteWithoutSdp) {
    extraHeaders.push('Content-Type: application/sdp');
  } else if (this.renderbody) {
    extraHeaders.push('Content-Type: ' + this.rendertype);
  }

  if (ua.configuration.reliable === 'required') {
    extraHeaders.push('Require: 100rel');
  }

  options.extraHeaders = extraHeaders;
  options.params = requestParams;

  SIP.Utils.augment(this, SIP.ClientContext, [ua, SIP.C.INVITE, target, options]);
  SIP.Utils.augment(this, SIP.Session);

  // Check Session Status
  if (this.status !== C.STATUS_NULL) {
    throw new SIP.Exceptions.InvalidStateError(this.status);
  }

  // Session parameter initialization
  this.from_tag = SIP.Utils.newTag();

  // OutgoingSession specific parameters
  this.isCanceled = false;
  this.received_100 = false;

  this.method = SIP.C.INVITE;

  this.receiveResponse = this.receiveInviteResponse;

  this.logger = ua.getLogger('sip.inviteclientcontext');

  if (stun_servers) {
    iceServers = SIP.UA.configuration_check.optional['stun_servers'](stun_servers);
    if (!iceServers) {
      throw new TypeError('Invalid stun_servers: '+ stun_servers);
    } else {
      this.stun_servers = iceServers;
    }
  }

  if (turn_servers) {
    iceServers = SIP.UA.configuration_check.optional['turn_servers'](turn_servers);
    if (!iceServers) {
      throw new TypeError('Invalid turn_servers: '+ turn_servers);
    } else {
      this.turn_servers = iceServers;
    }
  }

  ua.applicants[this] = this;

  this.id = this.request.call_id + this.from_tag;

};

InviteClientContext.prototype = {
  invite: function () {
    this.rtcMediaHandler = new RTCMediaHandler(this, {
      RTCConstraints: this.RTCConstraints,
      stun_servers: this.stun_servers,
      turn_servers: this.turn_servers
    });

    //Save the session into the ua sessions collection.
    this.ua.sessions[this.id] = this;

    var self = this,
    // User media succeeded
    userMediaSucceeded = function(stream) {
      self.rtcMediaHandler.addStream(
        stream,
        streamAdditionSucceeded,
        streamAdditionFailed
      );
    },

    // User media failed
    userMediaFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.failed(null, SIP.C.causes.USER_DENIED_MEDIA_ACCESS);
    },

    // rtcMediaHandler.addStream successfully added
    streamAdditionSucceeded = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      } else if (self.inviteWithoutSdp) {
        //just send an invite with no sdp...
        self.request.body = self.renderbody;
        self.status = C.STATUS_INVITE_SENT;
        self.send();
      } else {
        self.connecting(self.request);
        self.rtcMediaHandler.createOffer(
          offerCreationSucceeded,
          offerCreationFailed
        );
      }
    },

    // rtcMediaHandler.addStream failed
    streamAdditionFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.failed(null, SIP.C.causes.WEBRTC_ERROR);
    },

    // rtcMediaHandler.createOffer succeeded
    offerCreationSucceeded = function(offer) {
      if (self.isCanceled || self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.request.body = offer;
      self.status = C.STATUS_INVITE_SENT;
      self.send();
    },

    // rtcMediaHandler.createOffer failed
    offerCreationFailed = function() {
      if (self.status === C.STATUS_TERMINATED) {
        return;
      }

      self.failed(null, SIP.C.causes.WEBRTC_ERROR);
    };
    
    this.rtcMediaHandler.getUserMedia(
      userMediaSucceeded,
      userMediaFailed,
      this.mediaConstraints
    );

    return this;
  },

  receiveInviteResponse: function(response) {
    var cause, localMedia,
      session = this,
      id = response.call_id + response.from_tag + response.to_tag,
      extraHeaders = [],
      options = null;

    if (this.dialog && (response.status_code >= 200 && response.status_code <= 299)) {
      if (id !== this.dialog.id.toString() ) {
        if (!this.createDialog(response, 'UAC', true)) {
          return;
        }
        this.earlyDialogs[id].sendRequest(this, SIP.C.ACK);
        this.earlyDialogs[id].sendRequest(this, SIP.C.BYE);
        //session.failed(response, SIP.C.causes.WEBRTC_ERROR);
        return;
      } else if (this.status === C.STATUS_CONFIRMED) {
        this.sendRequest(SIP.C.ACK);
        return;
      }
    }

   /* if (this.status !== C.STATUS_INVITE_SENT && this.status !== C.STATUS_1XX_RECEIVED && this.status !== C.STATUS_EARLY_MEDIA) {
      if (response.status_code !== 200) {
        return;
      }
    } else */if (this.status === C.STATUS_EARLY_MEDIA && response.status_code !== 200) {
      //Early media has been set up with at least one other different branch, but a final 2xx response hasn't been received
      if (!this.earlyDialogs[id]) {
        this.createDialog(response, 'UAC', true);
      }
      extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
      this.earlyDialogs[id].pracked.push(response.getHeader('rseq'));

      this.earlyDialogs[id].sendRequest(this, SIP.C.PRACK, {
        extraHeaders: extraHeaders
      });
      return;
    }

    // Proceed to cancellation if the user requested.
    if(this.isCanceled) {
      if(response.status_code >= 100 && response.status_code < 200) {
        this.request.cancel(this.cancelReason);
        this.canceled(null);
      } else if(response.status_code >= 200 && response.status_code < 299) {
        this.acceptAndTerminate(response);
      }
      return;
    }

    switch(true) {
      case /^100$/.test(response.status_code):
        this.received_100 = true;
        break;
      case (/^1[0-9]{2}$/.test(response.status_code)):
        // Do nothing with 1xx responses without To tag.
        if(!response.to_tag) {
          this.logger.warn('1xx response received without to tag');
          break;
        }

        // Create Early Dialog if 1XX comes with contact
        if(response.hasHeader('contact')) {
          // An error on dialog creation will fire 'failed' event
          if (!this.createDialog(response, 'UAC', true)) {
            break;
          }
        }

        this.status = C.STATUS_1XX_RECEIVED;
        this.emit('progress', {
          response: response || null
        });

        if(response.hasHeader('require') && response.getHeader('require').indexOf('100rel') !== -1) {

          // Do nothing if this.dialog is already confirmed
          if (this.dialog || !this.earlyDialogs[id]) {
            break;
          }

          if (this.earlyDialogs[id].pracked.indexOf(response.getHeader('rseq')) !== -1 || (this.earlyDialogs[id].pracked[this.earlyDialogs[id].pracked.length-1] > response.getHeader('rseq') && this.earlyDialogs[id].pracked.length > 0)) {
            return;
          }

          if (window.mozRTCPeerConnection !== undefined) {
            response.body = response.body.replace(/relay/g, 'host generation 0');
            response.body = response.body.replace(/ \r\n/g, '\r\n');
          }
          if (!response.body) {
            extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
            this.earlyDialogs[id].pracked.push(response.getHeader('rseq'));
            this.earlyDialogs[id].sendRequest(this, SIP.C.PRACK, {
              extraHeaders: extraHeaders
            });
          } else if (this.request.body && (this.request.body !== this.renderbody)) {
            if (!this.createDialog(response, 'UAC')) {
              break;
            }

            this.rtcMediaHandler.onMessage(
              'answer',
              response.body,
              /*
               * onSuccess
               * SDP Answer fits with Offer. Media will start
               */
              function () {
                extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
                session.dialog.pracked.push(response.getHeader('rseq'));

                session.sendRequest(SIP.C.PRACK, {
                  extraHeaders: extraHeaders
                });
                session.status = C.STATUS_EARLY_MEDIA;
                if (session.status === C.STATUS_EARLY_MEDIA) {
                  localMedia = session.rtcMediaHandler.localMedia;
                  if (localMedia.getAudioTracks().length > 0) {
                    localMedia.getAudioTracks()[0].enabled = false;
                  }
                  if (localMedia.getVideoTracks().length > 0) {
                    localMedia.getVideoTracks()[0].enabled = false;
                  }
                }
              },
              /*
               * onFailure
               * SDP Answer does not fit the Offer. Accept the call and Terminate.
               */
              function(e) {
                session.logger.warn(e);
                session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
                session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
              }
            );
          } else {
            // rtcMediaHandler.addStream successfully added
            var streamAdditionSucceeded = function() {
              session.connecting(response);
              if (session.status === C.STATUS_TERMINATED) {
                return;
              }
              session.earlyDialogs[id].rtcMediaHandler.createAnswer(
                sdpCreationSucceeded,
                sdpCreationFailed
              );
            },

            // rtcMediaHandler.addStream failed
            streamAdditionFailed = function() {
              if (session.status === C.STATUS_TERMINATED) {
                return;
              }

              session.failed(null, SIP.C.causes.WEBRTC_ERROR);
            },

            // rtcMediaHandler.createAnswer succeeded
            sdpCreationSucceeded = function(body) {
              extraHeaders.push('Content-Type: application/sdp');
              extraHeaders.push('RAck: ' + response.getHeader('rseq') + ' ' + response.getHeader('cseq'));
              session.earlyDialogs[id].pracked.push(response.getHeader('rseq'));
              session.earlyDialogs[id].sendRequest(session, SIP.C.PRACK, {
                extraHeaders: extraHeaders,
                body: body
              });
            },

            // rtcMediaHandler.createAnswer failed
            sdpCreationFailed = function() {
              if (session.status === C.STATUS_TERMINATED) {
                return;
              }

              session.failed(null, SIP.C.causes.WEBRTC_ERROR);
            };

            this.earlyDialogs[id].rtcMediaHandler.localMedia = this.rtcMediaHandler.localMedia;
            this.earlyDialogs[id].rtcMediaHandler.onMessage(
              'offer',
              response.body,
              /*
               * onSuccess
               * SDP Offer is valid. Fire UA newRTCSession
               */
              function() {
                session.earlyDialogs[id].rtcMediaHandler.addStream(
                  session.rtcMediaHandler.localMedia,
                  streamAdditionSucceeded,
                  streamAdditionFailed
                );
              },
              /*
               * onFailure
               * Bad media description
               */
              function(e) {
                session.logger.warn('invalid SDP');
                session.logger.warn(e);
              }
            );
          }
        }
        break;
      case /^2[0-9]{2}$/.test(response.status_code):
        var cseq = this.request.cseq + ' ' + this.request.method;
        if (cseq !== response.getHeader('cseq')) {
          break;
        }

        if (this.status === C.STATUS_EARLY_MEDIA) {
          this.status = C.STATUS_CONFIRMED;
          localMedia = this.rtcMediaHandler.localMedia;
          if (localMedia.getAudioTracks().length > 0) {
            localMedia.getAudioTracks()[0].enabled = true;
          }
          if (localMedia.getVideoTracks().length > 0) {
            localMedia.getVideoTracks()[0].enabled = true;
          }
          if (this.renderbody) {
            extraHeaders.push('Content-Type: ' + this.rendertype);
            options.extraHeaders = extraHeaders;
            options.body = this.renderbody;
          }
          this.sendRequest(SIP.C.ACK, options);
          this.accepted(response);
          break;
        }
        // Do nothing if this.dialog is already confirmed
        if (this.dialog) {
          break;
        }

        if(!response.body) {
          this.acceptAndTerminate(response, 400, 'Missing session description');
          this.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
          break;
        } else if (window.mozRTCPeerConnection !== undefined) {
          response.body = response.body.replace(/relay/g, 'host generation 0');
          response.body = response.body.replace(/ \r\n/g, '\r\n');
        }

        // This is an invite without sdp
        if (!this.request.body || (this.request.body === this.renderbody)) {
          if (this.earlyDialogs[id] && this.earlyDialogs[id].rtcMediaHandler.localMedia) {
            this.rtcMediaHandler = this.earlyDialogs[id].rtcMediaHandler;
            if (!this.createDialog(response, 'UAC')) {
              break;
            }
            session.status = C.STATUS_CONFIRMED;
            session.sendRequest(SIP.C.ACK);

            localMedia = session.rtcMediaHandler.localMedia;
            if (localMedia.getAudioTracks().length > 0) {
              localMedia.getAudioTracks()[0].enabled = true;
            }
            if (localMedia.getVideoTracks().length > 0) {
              localMedia.getVideoTracks()[0].enabled = true;
            }
            session.accepted(response);
          } else {
            if (!this.createDialog(response, 'UAC')) {
              break;
            }
            this.rtcMediaHandler.onMessage(
              'offer',
              response.body,
              /*
               * onSuccess
               * SDP Offer is valid. Fire UA newRTCSession
               */
              function() {
                var offerCreationSucceeded = function (offer) {
                  var localMedia;
                  if(session.isCanceled || session.status === C.STATUS_TERMINATED) {
                    return;
                  }
                  /* 
                   * This is a Firefox hack to insert valid sdp when createAnswer is
                   * called with the constraint offerToReceiveVideo = false.
                   * We search for either a c-line at the top of the sdp above all 
                   * m-lines. If that does not exist then we search for a c-line 
                   * beneath each m-line. If it is missing a c-line, we insert 
                   * a fake c-line with the ip address 0.0.0.0. This is then valid
                   * sdp and no media will be sent for that m-line.
                   * 
                   * Valid SDP is:
                   * m=
                   * i=
                   * c=
                   */
                  if (offer.indexOf('c=') > offer.indexOf('m=')) {
                    var insertAt;
                    var mlines = (offer.match(/m=.*\r\n.*/g));
                    for (var i=0; i<mlines.length; i++) {
                      if (mlines[i].toString().search(/i=.*/) >= 0) {
                        insertAt = offer.indexOf(mlines[i].toString())+mlines[i].toString().length;
                        if (offer.substr(insertAt,2)!=='c=') {
                          offer = offer.substr(0,insertAt) + '\r\nc=IN IP 4 0.0.0.0' + offer.substr(insertAt);
                        }
                      } else if (mlines[i].toString().search(/c=.*/) < 0) {
                        insertAt = offer.indexOf(mlines[i].toString().match(/.*/))+mlines[i].toString().match(/.*/).toString().length;
                        offer = offer.substr(0,insertAt) + '\r\nc=IN IP4 0.0.0.0' + offer.substr(insertAt);
                      }
                    }
                  }

                  session.status = C.STATUS_CONFIRMED;

                  localMedia = session.rtcMediaHandler.localMedia;
                  if (localMedia.getAudioTracks().length > 0) {
                    localMedia.getAudioTracks()[0].enabled = true;
                  }
                  if (localMedia.getVideoTracks().length > 0) {
                    localMedia.getVideoTracks()[0].enabled = true;
                  }
                  session.sendRequest(SIP.C.ACK,{
                    body:offer,
                    extraHeaders:['Content-Type: application/sdp']
                  });
                  session.accepted(response);
                };
                var offerCreationFailed = function () {
                  //do something here
                  console.log("there was a problem");
                };
                session.rtcMediaHandler.createAnswer(
                  offerCreationSucceeded,
                  offerCreationFailed
                );
              },
              /*
               * onFailure
               * Bad media description
               */
              function(e) {
                session.logger.warn('invalid SDP');
                session.logger.warn(e);
                response.reply(488);
              }
            );
          }
        } else {
          if (!this.createDialog(response, 'UAC')) {
            break;
          }
          this.rtcMediaHandler.onMessage(
            'answer',
            response.body,
            /*
             * onSuccess
             * SDP Answer fits with Offer. Media will start
             */
            function() {
              var localMedia, options = {};
              session.status = C.STATUS_CONFIRMED;
              localMedia = session.rtcMediaHandler.localMedia;
              if (localMedia.getAudioTracks().length > 0) {
                localMedia.getAudioTracks()[0].enabled = true;
              }
              if (localMedia.getVideoTracks().length > 0) {
                localMedia.getVideoTracks()[0].enabled = true;
              }
              if (session.renderbody) {
                extraHeaders.push('Content-Type: ' + session.rendertype);
                options.extraHeaders = extraHeaders;
                options.body = session.renderbody;
              }
              session.sendRequest(SIP.C.ACK, options);
              session.accepted(response);
            },
            /*
             * onFailure
             * SDP Answer does not fit the Offer. Accept the call and Terminate.
             */
            function(e) {
              session.logger.warn(e);
              session.acceptAndTerminate(response, 488, 'Not Acceptable Here');
              session.failed(response, SIP.C.causes.BAD_MEDIA_DESCRIPTION);
            }
          );
        }
        break;
      default:
        cause = SIP.Utils.sipErrorCause(response.status_code);
        this.failed(response, cause);
        this.rejected(response, cause);
        this.terminated(response, cause);
    }
  },

  cancel: function(options) {
    options = options || {};

    var
    status_code = options.status_code,
    reason_phrase = options.reason_phrase,
    cancel_reason;

    // Check Session Status
    if (this.status === C.STATUS_TERMINATED) {
      throw new SIP.Exceptions.InvalidStateError(this.status);
    }

    this.logger.log('canceling RTCSession');

    if (status_code && (status_code < 200 || status_code >= 700)) {
      throw new TypeError('Invalid status_code: '+ status_code);
    } else if (status_code) {
      reason_phrase = reason_phrase || SIP.C.REASON_PHRASE[status_code] || '';
      cancel_reason = 'SIP ;cause=' + status_code + ' ;text="' + reason_phrase + '"';
    }

    // Check Session Status
    if (this.status === C.STATUS_NULL) {
      this.isCanceled = true;
      this.cancelReason = cancel_reason;
    } else if (this.status === C.STATUS_INVITE_SENT) {
      if(this.received_100) {
        this.request.cancel(cancel_reason);
      } else {
        this.isCanceled = true;
        this.cancelReason = cancel_reason;
      }
    } else if(this.status === C.STATUS_1XX_RECEIVED) {
      this.request.cancel(cancel_reason);
    }

    this.canceled(null);
    this.failed(null, SIP.C.causes.CANCELED);
    this.terminated();

    return this;
  },
  
  terminate: function(options) {

    if (this.status === C.STATUS_WAITING_FOR_ACK || this.status === C.STATUS_CONFIRMED) {
      this.bye(options);
    } else {
      this.cancel(options);
    }

    this.terminated();

    return this;
  },

  receiveRequest: function(request) {
    var contentType, referSession;

    if(request.method === SIP.C.CANCEL) {
      /* RFC3261 15 States that a UAS may have accepted an invitation while a CANCEL
       * was in progress and that the UAC MAY continue with the session established by
       * any 2xx response, or MAY terminate with BYE. SIP does continue with the
       * established session. So the CANCEL is processed only if the session is not yet
       * established.
       */

      /*
       * Terminate the whole session in case the user didn't accept nor reject the
       *request opening the session.
       */
      if(this.status === C.STATUS_EARLY_MEDIA) {
        this.status = C.STATUS_CANCELED;
        this.request.reply(487);
        this.canceled(request);
        this.failed(request, SIP.C.causes.CANCELED);
      }
    } else {
      // Requests arriving here are in-dialog requests.
      switch(request.method) {
        case SIP.C.BYE:
          request.reply(200);
          this.bye();
          this.terminated(request, SIP.C.causes.BYE);
          break;
        case SIP.C.INVITE:
          this.logger.log('re-INVITE received');
          this.receiveReinvite(request);
          break;
        case SIP.C.ACK:
          if(this.status === C.STATUS_WAITING_FOR_ACK) {
            window.clearTimeout(this.timers.ackTimer);
            window.clearTimeout(this.timers.invite2xxTimer);
            this.status = C.STATUS_CONFIRMED;
          }
          break;
        case SIP.C.INFO:
          contentType = request.getHeader('content-type');
          if (contentType && (contentType.match(/^application\/dtmf-relay/i))) {
            new DTMF(this).init_incoming(request);
          }
          break;
        case SIP.C.REFER:
          this.logger.log('REFER received');
          request.reply(202, 'Accepted');

          (new Request(this)).send(SIP.C.NOTIFY, {
            extraHeaders: [
              'Event: refer',
              'Subscription-State: terminated',
              'Content-Type: message/sipfrag'
            ],
            body: 'SIP/2.0 100 Trying'
          });

          /*
            Harmless race condition.  Both sides of REFER
            may send a BYE, but in the end the dialogs are destroyed.
          */
          referSession = this.ua.invite(request.parseHeader('refer-to').uri, {
            mediaConstraints: this.media_constraints
          });

          this.referred(referSession);

          this.terminate();
          break;
      }
    }
  }
};

SIP.InviteClientContext = InviteClientContext;

}(SIP));
