import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-app.js";

// import {
//   getFirestore,
//   collection,
//   getDocs,
// } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore-lite.js"; --no work for some cases

import {
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-storage.js";

import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  getDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAe-fOTdVrVDkBjL7J4Z8Y_MsqO_hWSVp8",
  authDomain: "soteriax-las.firebaseapp.com",
  projectId: "soteriax-las",
  storageBucket: "soteriax-las.appspot.com",
  messagingSenderId: "842439281384",
  appId: "1:842439281384:web:353ec16d4aa1c5c7d1975d",
  measurementId: "G-HC9W82JVVW",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// // Get a list of cities from your database
// async function getCities(db) {
//   const citiesCol = collection(db, "complaints");
//   const citySnapshot = await getDocs(citiesCol);
//   const cityList = citySnapshot.docs.map((doc) => {
//     console.log(doc.data());
//   });
//   return cityList;
// }
// getCities(db);

let uid = "kXlyrP2XsrYTJOisDOpkAll4AvG3"; //the uid of the company is hardcoded to the PI board
let constraintObj = { video: true }; //contraints for getUserMedia object

let shutDownTimeout = setTimeout(shutDown, 1800000); //the shutDown function will be called after 30 minutes (if we didn't receive mission data within 30 minutes)

function shutDown() {
  //TODO: perform an API request to shutdown the RasPi
  //maybe first stop the server and 2 second interval timing (then recording and all stuff get stopped), and then we can perform shutdown
  console.log("We are going to shutdown");
}

navigator.mediaDevices
  .getUserMedia(constraintObj)
  .then(function (mediaStreamObj) {
    //retrieving the video from camera
    let mediaRecorder = new MediaRecorder(mediaStreamObj);
    let chunks = []; //variable to store the recorded video

    //start the recodring
    mediaRecorder.start();

    //storing the video recording in chunks variable
    mediaRecorder.ondataavailable = function (ev) {
      chunks.push(ev.data);
    };

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
    console.log(
      "stream has sent to the broadcaster API - now you can retrieve it from mobile/web"
    );

    //send a timestamp to database each 2 seconds - so that it knows we are up and running
    let activeStatusTimer = setInterval(sendActiveStatus, 2000);

    async function sendActiveStatus() {
      const documentRef = doc(db, "headLifeguards", uid);

      await updateDoc(documentRef, {
        piLastOnlineTime: +new Date(), //updating the HL collection by sending last online time of the pi board
      });
    }

    //TODO: the function to stop the last online time updation
    //clearInterval(activeStatusTimer);

    /*
    The Algorithm
      01. Get mission id and mission type. how?? continously ask from server 30minutes for each 5 second until you get it. If you don't shutdown the RasPi
      02. If no mission id and type for 30 miutes, abort the recording and stream
      03. Watch the mission document - observe whether the state changed to last
      04.   Then stop the recording and upload (change state to uploading)
      05.   once it is finished, stop stream. and set the state to end
    */

    let apiRequestTimer = setInterval(apiRequest, 5000); //perform this API request for each 5 second

    async function apiRequest() {
      const payload = {
        test: "hi",
      };
      const { data } = await axios.post("/retrieveMissionData", payload);
      console.log(data.missionId);
      console.log(data.missionType);
      //if both of those values are not empty, (that means a mobile has connected to the Pi board)
      if (data.missionId != "" && data.missionType != "") {
        //stop the interval function
        clearInterval(apiRequestTimer);
        //clear the 30 minute timeout - (stop RasPi from shutting down)
        clearTimeout(shutDownTimeout);
        //setup mission data
        let missionId = data.missionId;
        let missionType = data.missionType;

        ///now we can communicate with firebase to complete next steps///

        //listen to database to see whether the mission has been ended. Then end the recording and upload it.
        //if this is an operation (a real one)
        if (missionType === "operation") {
          const unsub = onSnapshot(doc(db, "operations", missionId), (doc) => {
            //if the mission has ended
            if (doc.data().currentStage == 5) {
              //stop the recording
              mediaRecorder.stop(); //stop the recording
              console.log("Stopped the recording - operation");
            }
          });
        } else {
          //else this is a training operation
          const unsub = onSnapshot(
            doc(db, "trainingOperations", missionId),
            (doc) => {
              //if the mission has ended
              if (doc.data().currentStage == 5) {
                //stop the recording
                mediaRecorder.stop(); //stop the recording
                console.log("Stopped the recording - training");
              }
            }
          );
        }

        // //function to wait 5 seconds (for testing purposes)
        // const delay = (ms) => new Promise((res) => setTimeout(res, ms));

        // const letsWait = async () => {
        //   console.log("starting the wait");
        //   await delay(5000);
        //   console.log("Waited 5s");
        //   mediaRecorder.stop(); //stop the recording
        // };

        // letsWait(); //let's wait 5 seconds

        //this runs whenever the recording of the video get stopped
        mediaRecorder.onstop = (ev) => {
          let blob = new Blob(chunks, { type: "video/webm;" });
          chunks = [];

          //Get a reference to the storage service
          const storage = getStorage();
          // Create a storage reference from storage service
          const storageRef = ref(
            storage,
            `${missionType}/${uid}/${missionId}.webm`
          );

          if (missionType === "operation") {
            console.log("going to upload the video");
            async function updateOperations1() {
              //change the currentStage to uploading
              const documentRef = doc(db, "operations", missionId);
              await updateDoc(documentRef, {
                currentStage: 6,
                currentStatus: "Mission Video Uploading", //stage is uploading
              });
            }
            updateOperations1();
            // uploading the blob to the firebase
            uploadBytes(storageRef, blob).then((snapshot) => {
              console.log(
                "operation - Uploaded the recording to Firebase successfully!"
              );
              const documentRef = doc(db, "operations", missionId);
              //set the currentStage to 7 and change the operationStatus
              async function updateOperations2() {
                await updateDoc(documentRef, {
                  currentStage: 7, //stage is uploading
                  currentStatus: "Mission ended",
                  operationStatus: "ended", //status is "ended"
                });
              }
              updateOperations2();
            });
          } else {
            //else the mission type is training
            console.log("going to upload the video");
            async function updateTraining1() {
              //change the currentStage to uploading
              const documentRef = doc(db, "trainingOperations", missionId);
              await updateDoc(documentRef, {
                currentStage: 6,
                currentStatus: "Mission Video Uploading", //stage is uploading
              });
            }
            updateTraining1();
            // uploading the blob to the firebase
            uploadBytes(storageRef, blob).then((snapshot) => {
              console.log(
                "training - Uploaded the recording to Firebase successfully!"
              );
              //set the currentStage to 7 and change the completed flag
              async function updateTraining2() {
                const documentRef = doc(db, "trainingOperations", missionId);
                await updateDoc(documentRef, {
                  currentStage: 7, //stage is uploading
                  completed: true, //setting the completed to true
                  currentStatus: "Mission ended",
                  operationStatus: "ended", //status is "ended"
                });
              }
              updateTraining2();
            });
          }
        };
      }
    }
  })
  .catch(function (err) {
    console.log(err.name, err.message);
  });
