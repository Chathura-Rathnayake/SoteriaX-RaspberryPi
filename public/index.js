//the broadcaster's code
window.onload = () => {
    document.getElementById("my-button").onclick = () => {
      init();
    };
  };
  
  async function init() {
    //The await expression - causes async function execution to pause until a Promise is fulfilled or rejected
    //getting the video feed from the raspberryPi camera
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // .then(() => {
    //   console.log("all good");
    // })
    // .catch((error) => console.log(error));
    document.getElementById("video").srcObject = stream; //send it to the tag with id "video"
    const peer = createPeer();
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
  
    /*
    Note: Adding a track to a connection triggers renegotiation by firing a negotiationneeded event.
    addTrack() - The RTCPeerConnection method addTrack adds a new media track to the set of tracks which
    will be transmitted to the other peer. 
    */
  
    // navigator.mediaDevices
    //   .getUserMedia({ video: true, audio: true })
    //   .then((stream) => {
    //     /* use stream here */
    //   })
    //   .catch((error) => console.log(error));
  }
  
  function createPeer() {
    const peer = new RTCPeerConnection();
    //   {
    //   iceServers: [
    //     {
    //       urls: "stun:stun.stunprotocol.org:3478",
    //     },
    //   ],
    // }
  
    /*
    A negotiationneeded event is sent to the RTCPeerConnection when negotiation of the connection through the signaling channel is required.
    In here, function handleNegotiationNeededEvent is called to handle the negotiationneeded event when it occurs.
    */
  
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer); //because broadcaster is the one who offers
    return peer;
  }
  
  async function handleNegotiationNeededEvent(peer) {
    //set broadcaster's offer
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
      sdp: peer.localDescription,
    };
    const { data } = await axios.post("/broadcast", payload); //axios is used to make a post request to "/broadcast" including my(broadcaster's) offer
    const desc = new RTCSessionDescription(data.sdp); //retrieve the server SDP
    peer.setRemoteDescription(desc).catch((e) => console.log(e)); //set it as remote SDP
  }
  