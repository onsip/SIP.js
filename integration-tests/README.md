# BroadSoft Extensions Integration Tests

This directory contains integration testing resources for BroadSoft Access-Side Extensions in SIP.js.

## Overview

These integration tests validate the implementation of two BroadSoft extensions:

1. **Auto-Answer** - Automatic call answering based on Call-Info header
2. **Remote Control - Talk Events** - Remote control for answering/resuming calls

## Architecture

```
┌─────────────────┐         SIP/WebSocket        ┌──────────────┐
│   SIP.js Demo   │ ◄───────────────────────────► │  FreeSWITCH  │
│ (Web Browser)   │                                │   Server     │
└─────────────────┘                                └──────────────┘
        ▲                                                  │
        │                                                  │
        │ 1. Receives INVITE with Call-Info              │
        │    - Detects answer-after parameter            │
        │    - Auto-answers after delay                  │
        │                                                  │
        │ 2. Receives NOTIFY (Event: talk)               │
        │    - Answers call or resumes from hold         │
        └──────────────────────────────────────────────────┘
           Operator sends commands via fs_cli
```

## Prerequisites

### Software Requirements

- **Node.js**: v16 or later
- **FreeSWITCH**: 1.10.x or later
- **Web Browser**: Chrome, Firefox, or Safari (with WebRTC support)

### FreeSWITCH Configuration

1. **WebSocket Module**: Enable `mod_verto` or `mod_rtc` for WebSocket support
2. **SIP User**: Create a test user (e.g., 1000@localhost)
3. **Dialplan**: Configure dialplan for auto-answer (optional, can use originate command)

See [FREESWITCH.md](./FREESWITCH.md) for detailed FreeSWITCH configuration instructions.

## Setup

### 1. Build SIP.js and Demo

From the project root directory:

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Build the demo
npm run build-demo
```

### 2. Configure FreeSWITCH

Follow the instructions in [FREESWITCH.md](./FREESWITCH.md) to:
- Set up SIP users
- Configure WebSocket transport
- (Optional) Set up dialplan for auto-answer

### 3. Start Web Server

You need a web server to serve the demo. You can use any web server, for example:

```bash
# Using Python 3
cd demo
python3 -m http.server 8080

# Or using Node.js http-server
npx http-server demo -p 8080
```

## Running Tests

### Test 1: Auto-Answer

#### Objective
Verify that SIP.js automatically answers calls when the Call-Info header contains the `answer-after` parameter.

#### Steps

1. Open the demo in your browser:
   ```
   http://localhost:8080/demo-broadsoft.html
   ```

2. Configure connection settings:
   - **WebSocket Server**: `ws://localhost:5066` (or your FreeSWITCH WebSocket address)
   - **SIP User**: `1000` (your test user)
   - **Password**: Your user's password
   - **Domain**: `localhost` (or your domain)

3. Click **Connect** and wait for "Connected" status

4. From FreeSWITCH console (`fs_cli`), initiate a call with auto-answer:
   ```bash
   originate {sip_h_Call-Info=<sip:localhost>; answer-after=2}user/1000@localhost &echo
   ```

5. **Expected Results**:
   - Demo shows "Incoming call received"
   - Auto-Answer panel shows:
     - Enabled: ✓ Yes
     - Delay: 2 seconds
     - Countdown: 2s → 1s → 0s
   - Call is automatically answered after 2 seconds
   - Status changes to "Answered automatically"
   - Audio starts playing

#### Variations

Test different delays:
```bash
# Immediate answer (0 seconds)
originate {sip_h_Call-Info=<sip:localhost>; answer-after=0}user/1000@localhost &echo

# 5 second delay
originate {sip_h_Call-Info=<sip:localhost>; answer-after=5}user/1000@localhost &echo
```

### Test 2: Remote Control - Talk Events

#### Objective
Verify that SIP.js responds to remote talk commands via NOTIFY messages.

#### Steps

1. Establish a call (auto-answer or manual):
   ```bash
   originate user/1000@localhost &echo
   ```

2. Get the call UUID:
   ```bash
   show channels
   ```
   Look for the UUID in the output (first column)

3. Send talk event:
   ```bash
   uuid_phone_event <UUID> talk
   ```

4. **Expected Results**:
   - Demo event log shows: "🎤 Remote Control - Talk Event: talk"
   - Talk Event panel shows:
     - Last Event: talk
     - Microphone status is updated
   - Event is processed and logged

### Test 3: Remote Control - Hold Events

#### Objective
Verify that SIP.js responds to remote hold commands via NOTIFY messages.

#### Steps

1. Establish a call:
   ```bash
   originate user/1000@localhost &echo
   ```

2. Get the call UUID:
   ```bash
   show channels
   ```

3. Send hold event:
   ```bash
   uuid_phone_event <UUID> hold
   ```

4. **Expected Results**:
   - Demo event log shows: "⏸️ Remote Control - Hold Event: hold"
   - Hold Event panel shows:
     - Last Event: hold
     - Call status is updated
   - Event is processed and logged

### Test 4: Combined Scenario

#### Objective
Test all three features in sequence.

#### Steps

1. Initiate auto-answer call:
   ```bash
   originate {sip_h_Call-Info=<sip:localhost>; answer-after=1}user/1000@localhost &echo
   ```

2. Wait for auto-answer (1 second)

3. Get the call UUID:
   ```bash
   show channels
   ```

4. Test talk event:
   ```bash
   uuid_phone_event <UUID> talk
   ```

5. Test hold event:
   ```bash
   uuid_phone_event <UUID> hold
   ```

6. Hang up:
   ```bash
   uuid_kill <UUID>
   ```

#### Expected Results
- Call auto-answers after 1 second
- Talk event is received and processed correctly
- Hold event is received and processed correctly
- All events are logged in the event log
- All status panels update correctly

## Manual Controls Comparison

The demo provides manual controls (Mute checkbox, Hold checkbox) to compare behavior:

- **Manual Mute**: Initiated by clicking the checkbox
  - Status shows "Muted (manual)" in orange
- **Remote Mute**: Initiated by FreeSWITCH command
  - Status shows "Muted (by remote)" in red
  - Checkbox is automatically updated

This helps verify that remote control commands work independently of manual controls.

## Verification Checklist

Use this checklist to verify all features:

### Auto-Answer
- [ ] Call with answer-after=0 is answered immediately
- [ ] Call with answer-after=2 is answered after 2 seconds
- [ ] Call with answer-after=5 is answered after 5 seconds
- [ ] Countdown timer displays correctly
- [ ] Status updates show correct information
- [ ] Call without auto-answer requires manual answer

### Remote Control - Talk
- [ ] Mute command mutes the microphone
- [ ] Unmute command unmutes the microphone
- [ ] Status panel updates correctly
- [ ] Event log shows all events
- [ ] Manual mute still works independently

### Remote Control - Hold
- [ ] Hold command places call on hold
- [ ] Unhold command resumes call
- [ ] Audio behavior is correct
- [ ] Status panel updates correctly
- [ ] Event log shows all events
- [ ] Manual hold still works independently

## Troubleshooting

### Demo doesn't connect to FreeSWITCH

**Check**:
1. FreeSWITCH WebSocket module is enabled
2. WebSocket port is correct (default: 5066 for mod_verto, 8081 for mod_rtc)
3. SIP user credentials are correct
4. Browser console for errors

### Auto-Answer doesn't work

**Check**:
1. Call-Info header is being sent by FreeSWITCH (check with SIP trace)
2. answer-after parameter format is correct
3. Browser console for JavaScript errors
4. Event log for error messages

### Remote Control events not received

**Check**:
1. Call is established (not just ringing)
2. UUID is correct (use `show channels`)
3. FreeSWITCH logs for NOTIFY messages
4. Browser console for errors in NOTIFY handling

### Audio issues

**Check**:
1. Browser permissions for microphone/speaker
2. Browser console for media errors
3. Remote audio element is playing
4. Volume is not muted in browser

## Logs and Debugging

### Browser Console
Open browser DevTools (F12) to see:
- SIP.js debug messages
- JavaScript errors
- Network activity

### FreeSWITCH Console
From `fs_cli`:
```bash
# Enable debug logging
console loglevel debug

# Show SIP messages
sofia global siptrace on

# Monitor events
/events plain all
```

### Event Log in Demo
The demo includes an event log that shows:
- Connection events
- Call state changes
- BroadSoft events
- Errors and warnings

Use the "Clear Log" button to reset the log.

## Additional Resources

- [FREESWITCH.md](./FREESWITCH.md) - FreeSWITCH configuration details
- [BroadSoft Extensions Documentation](../src/api/broadsoft/README.md)
- [Example Code](../examples/broadsoft-extensions.ts)
- [Unit Tests](../test/spec/api/broadsoft/)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review FreeSWITCH and SIP.js logs
- Consult the BroadSoft extensions documentation
- Open an issue on the SIP.js GitHub repository
