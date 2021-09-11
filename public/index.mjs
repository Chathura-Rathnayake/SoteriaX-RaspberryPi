let constraintObj = { video: true }; //contraints for getUserMedia object

navigator.mediaDevices
  .getUserMedia(constraintObj)
  .then(function (mediaStreamObj) {
    //retrieving the video from camera
    let mediaRecorder = new MediaRecorder(mediaStreamObj);
    let chunks = []; //variable to store the recorded video

    //start the recodring
    mediaRecorder.start();

    //code to broadcast the stream to mobile and web
    function webRTC() {
      async function init() {
        const peer = createPeer();
        mediaStreamObj
          .getTracks()
          .forEach((track) => peer.addTrack(track, mediaStreamObj));
      }

      init();

      function createPeer() {
        const peer = new RTCPeerConnection();
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
    }

    //execute the webRTC code
    webRTC();

    //function to wait 5 seconds (for testing purposes)
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));

    const letsWait = async () => {
      await delay(5000);
      console.log("Waited 5s");
      mediaRecorder.stop(); //stop the recording
    };

    letsWait(); //let's wait 5 seconds

    //storing the video recording in chunks variable
    mediaRecorder.ondataavailable = function (ev) {
      chunks.push(ev.data);
    };

    //this runs whenever the recording of the video get stopped
    mediaRecorder.onstop = (ev) => {
      let blob = new Blob(chunks, { type: "video/webm;" });
      chunks = [];

      //upload the recorded video to the firebase storage
      console.log("done");
    };
  })
  .catch(function (err) {
    console.log(err.name, err.message);
  });
