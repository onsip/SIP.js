var localMinSE = 90;

module.exports = function (Timers) {

// http://tools.ietf.org/html/rfc4028#section-9
function hasSmallMinSE (message) {
  var supportedOptions = message.parseHeader('Supported') || [];
  var sessionExpires = message.parseHeader('Session-Expires') || {};
  return supportedOptions.indexOf('timer') >= 0 && sessionExpires.deltaSeconds < localMinSE;
}

function updateState (dialog, response) {
  dialog.sessionTimerState = dialog.sessionTimerState || {};
  Timers.clearTimeout(dialog.sessionTimerState.timeout);

  var sessionExpires = response.parseHeader('Session-Expires');
  // If the most recent 2xx response had no Session-Expires header field, there
  // is no session expiration, and no refreshes have to be performed
  if (!sessionExpires) {
    dialog.sessionTimerState = null;
    return;
  }

  var interval = sessionExpires.deltaSeconds;
  var isRefresher = sessionExpires.refresher === dialog.type.toLowerCase();

  dialog.sessionTimerState = {
    interval: interval,
    isRefresher: isRefresher
  };

  var intervalMilliseconds = interval * 1000;
  if (isRefresher) {
    dialog.sessionTimerState.timeout = Timers.setTimeout(function sendRefresh () {
      // TODO
    }, intervalMilliseconds / 2);
  } else {
    var before = Math.min(32 * 1000, intervalMilliseconds / 3);
    dialog.sessionTimerState.timeout = Timers.setTimeout(function sendBye () {
      // TODO
    }, intervalMilliseconds - before);
  }
}

return {
  localMinSE: localMinSE,
  hasSmallMinSE: hasSmallMinSE,
  updateState: updateState
};

};
