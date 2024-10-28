//  express: Imports the Express framework for creating a basic web server.
//  http: Imports the built-in Node.js HTTP module for creating an HTTP server.
// socketIo: Imports the Socket.IO library for real-time communication between the server and web clients.
// mediasoup: Imports the mediasoup library for handling WebRTC media processing.
// mediasoupConfig: Imports a separate configuration file (./config/mediasoupConfig) containing options for mediasoup, like media codecs and WebRTC transport settings.

const express = require('express');
const cors = require('cors');
const sfuServer = require('./sfu/sfuServer')
const bodyParser = require('body-parser')
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.get('/api/status',(req,res)=>{
    return res.send({status:'Server is Running!'})
})


// Initialize the SFU Server
sfuServer.init();

const PORT = 4000;

app.listen(PORT,()=>{
console.log(`server started at: ${PORT}`);
});


