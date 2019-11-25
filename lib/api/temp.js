"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require(".");
var registerer_1 = require("./registerer");
// tslint:disable:no-console
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
    inviter.invite({
        requestDelegate: {
            onProgress: function (response) {
                var statusCode = response.message.statusCode;
                /* is it a 183... */
            }
        }
    });
});
var uri = _1.UserAgent.makeURI("sip:alice@example.com");
if (!uri) {
    throw new Error("");
}
var options = {
    authenticationUsername: "username",
    authenticationPassword: "password",
    uri: uri
};
// const userAgent = new UserAgent(options);
var registerer1 = new registerer_1.Registerer(userAgent);
// Setup registerer state change handler
registerer1.stateChange.on(function (newState) {
    switch (newState) {
        case _1.RegistererState.Registered:
            console.log("Registered");
            break;
        case _1.RegistererState.Unregistered:
            console.log("Unregistered");
            break;
    }
});
// Send REGISTER
registerer1.register()
    .then(function (request) {
    console.log("Successfully sent REGISTER");
    console.log("REGISTER request = " + request);
})
    .catch(function (error) {
    console.log("Failed to send REGISTER");
});
var registered = registerer1.state === _1.RegistererState.Registered;
registerer1.unregister();
// Target URI
// const uri = UserAgent.makeURI("sip:alice@example.com");
// Create new Session instance in "initial" state
var session = new _1.Inviter(userAgent, uri);
// Setup session state change handler
session.stateChange.on(function (newState) {
    switch (newState) {
        case _1.SessionState.Establishing:
            console.log("Ringing");
            break;
        case _1.SessionState.Established:
            console.log("Answered");
            break;
        case _1.SessionState.Terminated:
            console.log("Ended");
            break;
    }
});
var constraints = {
    audio: true,
    video: false
};
var sdhOptions = { constraints: constraints };
// Options including delegate to capture response messages
var inviteOptions = {
    requestDelegate: {
        onAccept: function (response) {
            console.log("Positive response = " + response);
        },
        onReject: function (response) {
            console.log("Negative response = " + response);
        }
    },
    // sessionDescriptionHandlerOptions: {
    //   constraints: {
    //     audio: true,
    //     video: false
    //   }
    // }
    sessionDescriptionHandlerOptions: sdhOptions
};
// Send initial INVITE
session.invite(inviteOptions)
    .then(function (request) {
    console.log("Successfully sent INVITE");
    console.log("INVITE request = " + request);
})
    .catch(function (error) {
    console.log("Failed to send INVITE");
});
