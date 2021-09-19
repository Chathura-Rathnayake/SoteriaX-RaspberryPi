import express from "express";
const app = express();

import bodyParser from "body-parser"; //allows express to read the body and then parse that into a json object
import webrtc from "wrtc"; //allows to make our server a webRTC endpoint (it allows other peers to connect to this)
import cors from "cors";

//open the index.html file automatically
import openurl from "openurl";
openurl.open("http://localhost:5000/");

let senderStream; //this variable contains the stream received from the broadcaster (from the pi camera)
let senderAudioStream; //this variable contains the audio stream

let missionId = "";
let missionType = "";
let isAudio = false; //this flag is used to identify the mobile who is connecting with an audio stream

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.post("/retrieveMissionData", async ({ body }, res) => {
  console.log(body.test);
  const payload = {
    missionId: missionId,
    missionType: missionType,
    isAudio: isAudio,
  };
  res.json(payload); //sending the current mission data
});

//the consumer will ask for the broadcaster stream from the server via this endpoint
app.post("/consumer", async ({ body }, res) => {
  const peer = new webrtc.RTCPeerConnection();

  //       {
  //     iceServers: [
  //       {
  //         urls: "stun:stun.stunprotocol.org:3478",
  //       },
  //     ],
  //   }

  //set values retrieved from web/mobile to these global variables
  missionId = body.missionId;
  missionType = body.missionType;

  //parsing the sdp received from mobile or web
  const theSDP = JSON.parse(body.sdp);

  const desc = new webrtc.RTCSessionDescription(theSDP); //getting the consumer sdp (consumers offer)
  await peer.setRemoteDescription(desc); //setting it as the remote peer description
  //senderStream is the stream sent by broadcaster
  //what we received from broadcaster will be transmitted to the consumer
  senderStream
    .getTracks()
    .forEach((track) => peer.addTrack(track, senderStream));
  const answer = await peer.createAnswer(); //create my answer to the consumer offer
  await peer.setLocalDescription(answer);
  const payload = {
    sdp: peer.localDescription,
  };

  res.json(payload); //sending my answer to the peer
});

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

//the broadcaster will send its stream to the server via this endpoint
app.post("/audioBroadcaster", async ({ body }, res) => {
  const peer = new webrtc.RTCPeerConnection(); //returns a newly-created RTCPeerConnection, which represents a connection between the local device and a remote peer.

  // {
  //   iceServers: [
  //     {
  //       urls: "stun:stun.stunprotocol.org:3478",
  //     },
  //   ],
  // }
  //in the above RTCPeerConnection we are actually not specifiying any STUN serrver - connections will only be local

  //when a track is received to the server from the broadcaster, this ontrack event gets raised and handleTrackEvent function is called
  peer.ontrack = (e) => handleAudioTrackEvent(e, peer);

  //parsing the sdp received from mobile
  const theSDP = JSON.parse(body.sdp);
  isAudio = body.isAudio; //setting the status flag
  const desc = new webrtc.RTCSessionDescription(theSDP); //getting the consumer sdp (consumers offer)
  await peer.setRemoteDescription(desc); //setting it as the remote peer description

  const answer = await peer.createAnswer(); //create server's answer to that offer - we need to send it to broadcaster back
  await peer.setLocalDescription(answer); //setting it as the local peer description

  //to send server sdp back to broadcaster
  const payload = {
    sdp: peer.localDescription,
  };
  // isAudioAvailable = true;
  res.json(payload); //setting the response including local SDP
});

function handleAudioTrackEvent(e, peer) {
  senderAudioStream = e.streams[0]; //getting the stream from broadcaster to senderStream variable
}

app.listen(5000, () =>
  console.log("The RaspberryPi server is up and running.!")
);
