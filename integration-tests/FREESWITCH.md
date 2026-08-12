# FreeSWITCH Configuration for BroadSoft Extensions Testing

This document describes how to configure FreeSWITCH to test BroadSoft Access-Side Extensions with SIP.js.

## Overview

FreeSWITCH supports BroadSoft extensions through:
1. **Auto-Answer**: Using `sip_h_Call-Info` channel variable
2. **Remote Control Events**: Using `uuid_phone_event` command

## Prerequisites

- FreeSWITCH installed and running
- SIP user configured (e.g., 1000@localhost)
- WebSocket module enabled (mod_verto or mod_rtc)

## 1. Auto-Answer Configuration

### Call-Info Header Format

The Call-Info header with `answer-after` parameter tells the SIP client to automatically answer the call after a specified delay.

**Format:**
```
Call-Info: <sip:domain>; answer-after=<seconds>
```

### Setting Call-Info in Dialplan

#### Method 1: Using Dialplan (XML)

Create or edit `/usr/local/freeswitch/conf/dialplan/default/broadsoft-test.xml`:

```xml
<extension name="broadsoft-auto-answer-test">
  <condition field="destination_number" expression="^(9001)$">
    <action application="answer"/>
    <action application="set" data="call_timeout=120"/>

    <!-- Set Call-Info header with answer-after parameter -->
    <action application="export" data="sip_h_Call-Info=&lt;sip:${domain}&gt;; answer-after=0"/>

    <!-- Bridge to test user -->
    <action application="bridge" data="user/1000@${domain}"/>
  </condition>
</extension>

<extension name="broadsoft-auto-answer-delayed">
  <condition field="destination_number" expression="^(9002)$">
    <action application="answer"/>

    <!-- Set Call-Info header with 2 second delay -->
    <action application="export" data="sip_h_Call-Info=&lt;sip:${domain}&gt;; answer-after=2"/>

    <action application="bridge" data="user/1000@${domain}"/>
  </condition>
</extension>

<extension name="broadsoft-auto-answer-5sec">
  <condition field="destination_number" expression="^(9003)$">
    <action application="answer"/>

    <!-- Set Call-Info header with 5 second delay -->
    <action application="export" data="sip_h_Call-Info=&lt;sip:${domain}&gt;; answer-after=5"/>

    <action application="bridge" data="user/1000@${domain}"/>
  </condition>
</extension>
```

#### Method 2: Using originate Command

From FreeSWITCH console (`fs_cli`):

```bash
# Immediate auto-answer (0 seconds)
originate {sip_h_Call-Info=<sip:${domain}>; answer-after=0}user/1000@${domain} &echo

# Auto-answer after 2 seconds
originate {sip_h_Call-Info=<sip:${domain}>; answer-after=2}user/1000@${domain} &echo

# Auto-answer after 5 seconds
originate {sip_h_Call-Info=<sip:${domain}>; answer-after=5}user/1000@${domain} &echo
```

**Note**: Replace `${domain}` with your actual domain (e.g., `localhost` or your server's domain).

### Testing Auto-Answer

1. Start the SIP.js demo (`demo-broadsoft.html`)
2. Connect to FreeSWITCH
3. From `fs_cli`, run:
   ```bash
   originate {sip_h_Call-Info=<sip:localhost>; answer-after=2}user/1000@localhost &echo
   ```
4. Observe the SIP.js demo:
   - Should detect auto-answer is enabled
   - Should show 2 second countdown
   - Should automatically answer after 2 seconds

## 2. Remote Control - Talk Events

### Overview

FreeSWITCH's `uuid_phone_event` command can send NOTIFY messages with `Event: talk` to control microphone state.

### Command

```bash
uuid_phone_event <uuid> talk
```

**Note**: This command sends a talk event notification. The SIP.js implementation interprets this as "unmute" (TalkAction.Talk).

### SIP Message Format

FreeSWITCH will send a NOTIFY message like:

```
NOTIFY sip:1000@localhost SIP/2.0
Event: talk
Subscription-State: active
Content-Length: 0

```

**Important**: The NOTIFY body is empty (Content-Length: 0). The event type is conveyed through the `Event` header only.

### Testing Talk Events

1. Establish a call between FreeSWITCH and the SIP.js client
2. Get the call UUID from `fs_cli`:
   ```bash
   show channels
   ```
3. Send talk event:
   ```bash
   uuid_phone_event <uuid> talk
   ```
4. Observe the SIP.js demo:
   - Should receive NOTIFY with Event: talk
   - Microphone should be unmuted (TalkAction.Talk is applied)
   - Status should update to "Active"
   - Event log shows "Remote Control - Talk Event: talk"

## 3. Remote Control - Hold Events

### Overview

FreeSWITCH's `uuid_phone_event` command can send NOTIFY messages with `Event: hold` to control call hold state.

### Command

```bash
uuid_phone_event <uuid> hold
```

**Note**: This command sends a hold event notification. The SIP.js implementation interprets this as "hold" (HoldAction.Hold).

### SIP Message Format

FreeSWITCH will send a NOTIFY message like:

```
NOTIFY sip:1000@localhost SIP/2.0
Event: hold
Subscription-State: active
Content-Length: 0

```

**Important**: The NOTIFY body is empty (Content-Length: 0). The event type is conveyed through the `Event` header only.

### Testing Hold Events

1. Establish a call between FreeSWITCH and the SIP.js client
2. Get the call UUID from `fs_cli`:
   ```bash
   show channels
   ```
3. Send hold event:
   ```bash
   uuid_phone_event <uuid> hold
   ```
4. Observe the SIP.js demo:
   - Should receive NOTIFY with Event: hold
   - Call should be placed on hold automatically (HoldAction.Hold is applied)
   - Status should update to "On Hold (by remote)"
   - Audio should be paused (SDP re-negotiation with sendonly)
   - Event log shows "Remote Control - Hold Event: hold"

## Complete Test Scenarios

### Scenario 1: Auto-Answer with Immediate Response

```bash
# From fs_cli
originate {sip_h_Call-Info=<sip:localhost>; answer-after=0}user/1000@localhost &echo

# Expected behavior:
# - SIP.js demo receives INVITE with Call-Info header
# - Detects answer-after=0
# - Automatically answers immediately
# - Call is established
```

### Scenario 2: Auto-Answer with Delay

```bash
# From fs_cli
originate {sip_h_Call-Info=<sip:localhost>; answer-after=5}user/1000@localhost &echo

# Expected behavior:
# - SIP.js demo receives INVITE with Call-Info header
# - Detects answer-after=5
# - Shows countdown: 5, 4, 3, 2, 1
# - Automatically answers after 5 seconds
# - Call is established
```

### Scenario 3: Remote Mute Control

```bash
# Step 1: Establish a call
originate user/1000@localhost &echo

# Step 2: Get the call UUID
show channels

# Step 3: Mute the call
uuid_phone_event <uuid> talk mute

# Wait 3 seconds

# Step 4: Unmute the call
uuid_phone_event <uuid> talk talk

# Expected behavior:
# - After mute command: microphone is muted
# - After unmute command: microphone is active
```

### Scenario 4: Remote Hold Control

```bash
# Step 1: Establish a call
originate user/1000@localhost &echo

# Step 2: Get the call UUID
show channels

# Step 3: Place call on hold
uuid_phone_event <uuid> hold hold

# Wait 3 seconds

# Step 4: Resume call
uuid_phone_event <uuid> hold unhold

# Expected behavior:
# - After hold command: call is placed on hold, audio pauses
# - After unhold command: call resumes, audio continues
```

### Scenario 5: Combined Test

```bash
# Step 1: Auto-answer call
originate {sip_h_Call-Info=<sip:localhost>; answer-after=1}user/1000@localhost &echo

# Wait for auto-answer (1 second)

# Step 2: Get UUID
show channels

# Step 3: Test mute
uuid_phone_event <uuid> talk mute
# Wait 2 seconds
uuid_phone_event <uuid> talk talk

# Step 4: Test hold
uuid_phone_event <uuid> hold hold
# Wait 2 seconds
uuid_phone_event <uuid> hold unhold

# Expected behavior:
# - Call auto-answers after 1 second
# - Microphone mutes and unmutes correctly
# - Call holds and resumes correctly
```

## Troubleshooting

### Issue: Call-Info header not being sent

**Solution**: Check that the `export` application is used, not just `set`:
```xml
<action application="export" data="sip_h_Call-Info=<sip:${domain}>; answer-after=2"/>
```

### Issue: uuid_phone_event not working

**Check**:
1. Verify the call UUID is correct:
   ```bash
   show channels
   ```
2. Ensure the call is established (not ringing)
3. Check FreeSWITCH logs:
   ```bash
   fs_cli -x "console loglevel debug"
   ```

### Issue: NOTIFY not received by SIP.js

**Check**:
1. Enable SIP message logging in FreeSWITCH
2. Verify the NOTIFY is being sent
3. Check browser console for errors
4. Ensure the session delegate is properly set up

## Reference

### FreeSWITCH Commands

- `originate` - Initiate a call
- `uuid_phone_event` - Send phone events to a call
- `show channels` - List active channels
- `uuid_dump <uuid>` - Show all variables for a call

### SIP Headers

- `Call-Info` - Contains auto-answer information
- `Event` - Specifies the event type in NOTIFY

### Event Types

- `talk` - Microphone control events
  - Body: `mute` or `talk`
- `hold` - Hold control events
  - Body: `hold`, `unhold`, or `resume`

## Additional Resources

- FreeSWITCH Documentation: https://freeswitch.org/confluence/
- BroadWorks SIP Access Side Extensions
- RFC 3515 - REFER Method
- RFC 3265 - SIP-Specific Event Notification
