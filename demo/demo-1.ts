// tslint:disable: no-console
import { SimpleUser, SimpleUserDelegate, SimpleUserOptions } from "../src/platform/web";
import { webSocketServer } from "./demo-constants";

function getAudio(id: string): HTMLAudioElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  }
  return el;
}

function getButton(id: string): HTMLButtonElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLButtonElement)) {
    throw new Error(`Element "${id}" not found or not a button element.`);
  }
  return el;
}

function getButtons(id: string): Array<HTMLButtonElement> {
  const els = document.getElementsByClassName(id);
  if (!els.length) {
    throw new Error(`Elements "${id}" not found.`);
  }
  const buttons: Array<HTMLButtonElement> = [];
  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (!(el instanceof HTMLButtonElement)) {
      throw new Error(`Element ${i} of "${id}" not a button element.`);
    }
    buttons.push(el);
  }
  return buttons;
}

function getInput(id: string): HTMLInputElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement)) {
    throw new Error(`Element "${id}" not found or not an input element.`);
  }
  return el;
}

function getSpan(id: string): HTMLSpanElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLSpanElement)) {
    throw new Error(`Element "${id}" not found or not a span element.`);
  }
  return el;
}

const serverSpan = getSpan("server");
const targetSpan = getSpan("target");
const connectButton = getButton("connect");
const callButton = getButton("call");
const hangupButton = getButton("hangup");
const disconnectButton = getButton("disconnect");
const audioElement = getAudio("remoteAudio");
const keypad = getButtons("keypad");
const dtmfSpan = getSpan("dtmf");
const holdCheckbox = getInput("hold");
const muteCheckbox = getInput("mute");

// Display server URL
serverSpan.innerHTML = webSocketServer;

// Display target URI
const target = "sip:welcome@onsip.com";
targetSpan.innerHTML = target;

// Name for demo user
const displayName = "SIP.js Demo";

// SimpleUser delegate
const simpleUserDelegate: SimpleUserDelegate = {
  onCallCreated: (): void => {
    console.log(`[${displayName}] Call created`);
    callButton.disabled = true;
    hangupButton.disabled = false;
    keypadDisabled(true);
    holdCheckboxDisabled(true);
    muteCheckboxDisabled(true);
  },
  onCallAnswered: (): void => {
    console.log(`[${displayName}] Call answered`);
    keypadDisabled(false);
    holdCheckboxDisabled(false);
    muteCheckboxDisabled(false);
  },
  onCallHangup: (): void => {
    console.log(`[${displayName}] Call hangup`);
    callButton.disabled = false;
    hangupButton.disabled = true;
    keypadDisabled(true);
    holdCheckboxDisabled(true);
    muteCheckboxDisabled(true);
  }
};

// SimpleUser options
const simpleUserOptions: SimpleUserOptions = {
  delegate: simpleUserDelegate,
  media: {
    remote: {
      audio: audioElement
    }
  },
  userAgentOptions: {
    displayName
  }
};

// SimpleUser construction
const simpleUser = new SimpleUser(webSocketServer, simpleUserOptions);

// Add click listener to connect button
connectButton.addEventListener("click", () => {
  connectButton.disabled = true;
  disconnectButton.disabled = true;
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser.connect()
    .then(() => {
      connectButton.disabled = true;
      disconnectButton.disabled = false;
      callButton.disabled = false;
      hangupButton.disabled = true;
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to connect`);
      console.error(error);
      alert("Failed to connect.\n" + error);
    });
});

// Add click listener to call button
callButton.addEventListener("click", () => {
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser.call(target)
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to place call`);
      console.error(error);
      alert("Failed to place call.\n" + error);
    });
});

// Add click listener to hangup button
hangupButton.addEventListener("click", () => {
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser.hangup()
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to hangup call`);
      console.error(error);
      alert("Failed to hangup call.\n" + error);
    });
});

// Add click listener to disconnect button
disconnectButton.addEventListener("click", () => {
  connectButton.disabled = true;
  disconnectButton.disabled = true;
  callButton.disabled = true;
  hangupButton.disabled = true;
  simpleUser.disconnect()
    .then(() => {
      connectButton.disabled = false;
      disconnectButton.disabled = true;
      callButton.disabled = true;
      hangupButton.disabled = true;
    })
    .catch((error: Error) => {
      console.error(`[${simpleUser.id}] failed to disconnect`);
      console.error(error);
      alert("Failed to disconnect.\n" + error);
    });
});

// Add click listeners to keypad buttons
keypad.forEach((button) => {
  button.addEventListener("click", () => {
    const tone = button.textContent;
    if (tone) {
      simpleUser.sendDTMF(tone)
        .then(() => {
          dtmfSpan.innerHTML += tone;
        });
    }
  });
});

// Keypad helper function
const keypadDisabled = (disabled: boolean): void => {
  keypad.forEach((button) => button.disabled = disabled);
  dtmfSpan.innerHTML = "";
};

// Add change listener to hold checkbox
holdCheckbox.addEventListener("change", () => {
  if (holdCheckbox.checked) {
    // Checkbox is checked..
    simpleUser.hold()
      .catch((error: Error) => {
        holdCheckbox.checked = false;
        console.error(`[${simpleUser.id}] failed to hold call`);
        console.error(error);
        alert("Failed to hold call.\n" + error);
      });
  } else {
    // Checkbox is not checked..
    simpleUser.unhold()
      .catch((error: Error) => {
        holdCheckbox.checked = true;
        console.error(`[${simpleUser.id}] failed to unhold call`);
        console.error(error);
        alert("Failed to unhold call.\n" + error);
      });
  }
});

// Hold helper function
const holdCheckboxDisabled = (disabled: boolean): void => {
  holdCheckbox.checked = false;
  holdCheckbox.disabled = disabled;
};

// Add change listener to mute checkbox
muteCheckbox.addEventListener("change", () => {
  if (muteCheckbox.checked) {
    // Checkbox is checked..
    simpleUser.mute();
    if (!simpleUser.isMuted) {
      muteCheckbox.checked = false;
      console.error(`[${simpleUser.id}] failed to mute call`);
      alert("Failed to mute call.\n");
    }
  } else {
    // Checkbox is not checked..
    simpleUser.unmute();
    if (!simpleUser.isMuted) {
      muteCheckbox.checked = true;
      console.error(`[${simpleUser.id}] failed to unmute call`);
      alert("Failed to unmute call.\n");
    }
  }
});

// Mute helper function
const muteCheckboxDisabled = (disabled: boolean): void => {
  muteCheckbox.checked = false;
  muteCheckbox.disabled = disabled;
};

// Enable the connect button
connectButton.disabled = false;
