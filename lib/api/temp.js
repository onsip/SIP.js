"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var registerer_1 = require("./registerer");
/*
 * Create a user agent
 */
var userAgentOptions = { /* ... */};
var userAgent = new _1.UserAgent(userAgentOptions);
/*
 * Setup handling for incoming INVITE requests
 */
userAgent.delegate = {
    onInvite: function (invitation) {
        // An Invitation is a Session
        var incomingSession = invitation;
        // Setup incoming session delegate
        incomingSession.delegate = {
            // Handle incoming REFER request.
            onRefer: function (referral) {
                // ...
            }
        };
        // Handle incoming session state changes.
        incomingSession.stateChange.on(function (newState) {
            switch (newState) {
                case _1.SessionState.Establishing:
                    // Session is establishing.
                    break;
                case _1.SessionState.Established:
                    // Session has been established.
                    break;
                case _1.SessionState.Terminated:
                    // Session has terminated.
                    break;
                default:
                    break;
            }
        });
    }
};
/*
 * Start user agent
 */
userAgent.start().then(function () {
    /*
     * Register the user agent
     */
    var registererOptions = { /* ... */};
    var registerer = new registerer_1.Registerer(userAgent, registererOptions);
    // Send the REGISTER request
    registerer.register();
    /*
     * Send an outgoing INVITE request
     */
    // Create a target URI
    var target = _1.UserAgent.makeURI("sip:alice@example.com");
    if (!target) {
        throw new Error("Failed to create target URI.");
    }
    // Create a new inviter
    var inviterOptions = { /* ... */};
    var inviter = new _1.Inviter(userAgent, target, inviterOptions);
    // An Inviter is a Session
    var outgoingSession = inviter;
    // Setup outgoing session delegate
    outgoingSession.delegate = {
        // Handle incoming REFER request.
        onRefer: function (referral) {
            // ...
        }
    };
    // Handle outgoing session state changes.
    outgoingSession.stateChange.on(function (newState) {
        switch (newState) {
            case _1.SessionState.Establishing:
                // Session is establishing.
                break;
            case _1.SessionState.Established:
                // Session has been established.
                break;
            case _1.SessionState.Terminated:
                // Session has terminated.
                break;
            default:
                break;
        }
    });
    // Send the INVITE request
    inviter.invite()
        .then(function () {
        // INVITE sent
    })
        .catch(function (error) {
        // INVITE did not send
    });
});
