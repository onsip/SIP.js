function RPSMediaHandler(session, options) {
  // Save this if you need to access the session for any reason.
  this.session = session;

  this.myGesture = null;
  this.theirGesture = null;
}

RPSMediaHandler.prototype = {
    /*
   * This media handler does not support renegotiation,
   * so isReady doesn't really matter.
   */
  isReady: function () { return true; },

    /*
   * Not much to do on cleanup.
   */
  close: function () {
    if (this.timeout) {
      clearTimeout(this.timeout);
      delete this.timeout;
    }
    delete this.session;
  },

    /*
   * The following methods are lingering dependencies that we plan
   * to clean up in the future.  If the media server provides implementations,
   * you could add the behavior to these for them to take effect.  Otherwise,
   * empty function are necessary to satisfy the dependency right now.
   */
  render: new Function(),
  mute: new Function(),
  unmute: new Function(),

  getDescription: function (onSuccess, onFailure, mediaHint) {
        /*
     * Here, you would asynchronously request an offer or answer
     * from your media server.  This probably involves creating a
     * room or session, and requesting SDP for that session.
     *
     * In this example, we aren't using a media server, so we will
     * create a custom media description using JSON.  The media hint will
     * determine if we throw Rock, Paper, or Scissors.
     *
     * We use setTimeout to force it to be asynchronous.
     */

    // 'Initialize' your media session.
    mediaHint || (mediaHint = {});
    if (['rock', 'paper', 'scissors'].indexOf(mediaHint.gesture) < 0) {
      this.timeout = setTimeout(function () {
        delete this.timeout;
        onFailure(new SIP.Exceptions.NotSupportedError('Gesture unsupported'));
      }.bind(this), 0);
      return;
    }

    this.myGesture = mediaHint.gesture;
    this.checkGestures();

    // Provide a description to the session using the callbacks.
    this.timeout = setTimeout(function () {
      delete this.timeout;
      onSuccess(this.myGesture);
    }.bind(this), 0);
  },

  setDescription: function (description, onSuccess, onFailure) {
        /*
     * Here, we receive the description of the remote end's offer/answer.
     * In normal WebRTC calls, this would be an RTCSessionDescription with
     * a String body that can be passed to the WebRTC core.  You will probably
     * just need to pass that to your media engine.
     *
     * In this simple example, our "media description" is simply a
     * String gesture indication the other end chose.
     */
    // Set their gesture based on the remote description
    if (['rock', 'paper', 'scissors'].indexOf(description) < 0) {
      this.timeout = setTimeout(function () {
        delete this.timeout;
        onFailure(new SIP.Exceptions.NotSupportedError('Gesture unsupported'));
      }.bind(this), 0);
    }

    this.theirGesture = description;
    this.checkGestures();

    this.timeout = setTimeout(function () {
      delete this.timeout;
      onSuccess();
    }.bind(this), 0);

  },

    /*
   * For our custom media handlers, whenever we receive and set
   * a remote gesture or provision and get our own gesture, we
   * check to see if we have both gestures.  If we do, the negotiation
   * is complete, and our session is 'up.'
   *
   * This would probably be something your media server would do on its own.
   */
  checkGestures: function () {
    if (!this.myGesture || !this.theirGesture) { return; }

    //console.log('\n\n------------\n\n');
    //console.log('Negotiation complete!');
    if (this.myGesture == this.theirGesture) {
      //console.log('TIE!');
    } else if ((this.myGesture == 'rock' && this.theirGesture == 'paper') ||
               (this.myGesture == 'paper' && this.theirGesture == 'scissors') ||
               (this.myGesture == 'scissors' && this.theirGesture == 'rock')) {
      //console.log('You lose!');
    } else {
      //console.log('You win!');
    }
    //console.log('\n\n------------\n\n');
  }
};

function rpsMediaHandlerFactory(session, options) {
  return new RPSMediaHandler(session, options);
}
