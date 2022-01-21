/**
 * Function which returns an RTCConfiguration.
 * @public
 */
export function defaultPeerConnectionConfiguration() {
    const configuration = {
        bundlePolicy: "balanced",
        certificates: undefined,
        iceCandidatePoolSize: 0,
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        iceTransportPolicy: "all",
        peerIdentity: undefined,
        rtcpMuxPolicy: "require"
    };
    return configuration;
}
