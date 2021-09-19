let apiRequestTimer = setInterval(apiRequest, 5000); //perform this API request for each 5 secon

async function apiRequest() {
  const payload = {
    test: "listening for incoming audio streams",
  };
  const { data } = await axios.post("/retrieveMissionData", payload);
  if (data.missionId != "" && data.missionType != "" && data.isAudio) {
    //if both of those values are not empty, (that means a mobile has connected to the Pi board)
    clearInterval(apiRequestTimer); // clearing the timer

    async function init() {
      const peer = createAudioPeer();
      //creates a pipe between consumer and server - a two way channel but here the direction is set to one way
      peer.addTransceiver("audio", { direction: "recvonly" });
    }

    init();

    function createAudioPeer() {
      const peer = new RTCPeerConnection();
      //   {
      //   iceServers: [
      //     {
      //       urls: "stun:stun.stunprotocol.org:3478",
      //     },
      //   ],
      // }
      peer.ontrack = handleAudioTrackEvent; //listen to ontrack event
      peer.onnegotiationneeded = () => handleAudioNegotiationNeededEvent(peer);

      return peer;
    }

    async function handleAudioNegotiationNeededEvent(peer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const payload = {
        sdp: peer.localDescription,
      };

      const { data } = await axios.post("/audioConsumer", payload); //requesting the audio stream from server
      const desc = new RTCSessionDescription(data.sdp);
      peer.setRemoteDescription(desc).catch((e) => console.log(e));
    }

    function handleAudioTrackEvent(e) {
      console.log(e.streams[0]);
      document.getElementById("audio").srcObject = e.streams[0]; //feeding the received audio stream to browser methods
    }
  }
}
