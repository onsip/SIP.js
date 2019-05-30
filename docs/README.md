# Documentation

[SIP.js API](./api/sip.js.md)

[SIP.js Core API](./core/sip.js.md)

### Example

```ts
class MyApp implements UserAgentDelegate {
  private userAgent: UserAgent;

  constructor() {
    const options: UserAgentOptions = {};
    this.userAgent = makeUserAgent(this, options);
  }

  // Send outgoing INVITE request.
  public invite(target: URI): void {
    const inviter = this.userAgent.makeInviter(target);
    const handler = new MySessionHandler(inviter);
    inviter._invite()
      .then(() => {
        // INVITE successfully sent
      })
      .catch((error: Error) => {
        // INVITE failed to send
      });
  }

  // Handle incoming INVITE request.
  public onInvite?(invitation: Invitation): void {
    const handler = new MySessionHandler(invitation);
    invitation._accept()
      .then(() => {
        // 200 OK successfully sent
      })
      .catch((error: Error) => {
        // 200 OK failed to send
      });
  }
}

class MySessionHandler implements SessionDelegate {
  constructor(private session: Session) {
    // Set ourselves as the session delegate
    this.session.delegate = this;

    // Handle session state changes.
    this.session.stateChange.on((newState: SessionState) => {
      switch (newState) {
        case "establishing":
          // Session is establishing.
          break;
        case "established":
          // Session has been established.
          break;
        case "terminated":
          // Session has terminated.
          break;
        default:
          break;
      }
    });
  }

  // Handle incoming REFER request.
  public onRefer?(referral: Referral): void {
    // ...
  }
}
```
