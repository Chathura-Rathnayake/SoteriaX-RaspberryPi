const express = require("express");
const app = express();
const bodyParser = require("body-parser"); //allows express to read the body and then parse that into a json object
const webrtc = require("wrtc"); //allows to make our server a webRTC endpoint (it allows other peers to connect to this)
var cors = require("cors");

let senderStream; //this variable contains the stream received from the broadcaster (from the pi camera)
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

//the broadcaster will send its stream to the server via this endpoint
app.post("/broadcast", async ({ body }, res) => {
  const peer = new webrtc.RTCPeerConnection(); //returns a newly-created RTCPeerConnection, which represents a connection between the local device and a remote peer.

  //in the above RTCPeerConnection we are actually not specifiying any STUN serrver - connections will only be local

  //       {
  //     iceServers: [
  //       {
  //         urls: "stun:stun.stunprotocol.org:3478",
  //       },
  //     ],
  //   }

  //when a track is received to the server from the broadcaster, this ontrack event gets raised and handleTrackEvent function is called
  peer.ontrack = (e) => handleTrackEvent(e, peer);

  const desc = new webrtc.RTCSessionDescription(body.sdp); //the broadcaster's sdp (the broadcasters offer)
  await peer.setRemoteDescription(desc); //setting it as the remote peer description

  const answer = await peer.createAnswer(); //create server's answer to that offer - we need to send it to broadcaster back
  await peer.setLocalDescription(answer); //setting it as the local peer description

  //to send server sdp back to broadcaster
  const payload = {
    sdp: peer.localDescription,
  };

  res.json(payload); //setting the response including local SDP
});

function handleTrackEvent(e, peer) {
  senderStream = e.streams[0]; //getting the stream from broadcaster to senderStream vairiable
}

app.listen(5000, () => console.log("The RaspberryPi server is up and running.!"));
