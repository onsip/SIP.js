import { MediaStreamFactory } from "./media-stream-factory";

/**
 * Function which returns a MediaStreamFactory.
 * @public
 */
export function defaultMediaStreamFactory(): MediaStreamFactory {
  return (constraints: MediaStreamConstraints, mediaStream?: any): Promise<MediaStream> => {
    // if no audio or video, return a media stream without tracks
    if (!constraints.audio && !constraints.video) {
      return Promise.resolve(new MediaStream());
    }
    // getUserMedia() is a powerful feature which can only be used in secure contexts; in insecure contexts,
    // navigator.mediaDevices is undefined, preventing access to getUserMedia(). A secure context is, in short,
    // a page loaded using HTTPS or the file:/// URL scheme, or a page loaded from localhost.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Privacy_and_security
    if (navigator.mediaDevices === undefined) {
      return Promise.reject(new Error("Media devices not available in insecure contexts."));
    }

    if (mediaStream) {
      return Promise.resolve(mediaStream)
    }

    return navigator.mediaDevices.getUserMedia.call(navigator.mediaDevices, constraints);
  };
}
