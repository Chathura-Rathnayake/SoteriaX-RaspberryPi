const express = require('express')
var Sound = require('node-aplay')
const app = express()
const {spawn} = require('child_process');
const port = 4000

app.get('/', (req, res) => {
	res.send(`RPi is server is listening on port ${port}`)
})
//-----------------------------------------------
app.get('/lock', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/lock.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
 });
 python.on('close', (code) => {
 res.send(dataToSend)

 });

})
//------------------------------------------------
app.get('/unlock', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/unlock.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });

})
//-----------------------------------------------
app.get('/alarm01', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/alarm01.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });

})
//-----------------------------------------------
app.get('/alarm02', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/alarm02.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });
 


})
//-----------------------------------------------
app.get('/alarm03', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/alarm03.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });

})
//-----------------------------------------------
app.get('/alarm04', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/alarm04.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });

})
app.get('/lighton', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/lighton.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });

})
//-----------------------------------------------
app.get('/lightoff', (req, res) => {
 var dataToSend;
 const python = spawn('python', ['scripts/lightoff.py']);

 python.stdout.on('data', function (data) {
  dataToSend = data.toString();
  res.send(dataToSend)	
 });

})
app.listen(port, () => {
  console.log(`RPI istening at http://localhost:${port}`)
})