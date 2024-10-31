//  express: Imports the Express framework for creating a basic web server.
//  http: Imports the built-in Node.js HTTP module for creating an HTTP server.
// socketIo: Imports the Socket.IO library for real-time communication between the server and web clients.
// mediasoup: Imports the mediasoup library for handling WebRTC media processing.
// mediasoupConfig: Imports a separate configuration file (./config/mediasoupConfig) containing options for mediasoup, like media codecs and WebRTC transport settings.

const http = require('http')
const express = require('express');
const cors = require('cors');
const sfuServer = require('./sfu/sfuServer')
const createTransport = require('./sfu/sfuServer');
const createProducer = require('./sfu/sfuServer');
const createConsumer = require('./sfu/sfuServer');
const init = require('./sfu/sfuServer');
const Websocket = require('ws')
const bodyParser = require('body-parser')
const PORT = 4000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new Websocket.Server({ server });

let peers = {};

// Initialize the SFU Server
init();

wss.on('connection',(ws) => {
    console.log('new client connected!');

    // handle messages from clients.

    ws.on('message',async(message) => {
        const data = JSON.parse(message);

        switch(data.type){
            case 'join':
                await handleJoin(ws,data);
                break;
            
            case 'startScreenShare':
                await handleStartScreenShare(ws,data);
                break;
            
            case 'stopScreenShare':
                await handleStopScreenShare(ws,data);
                break;
            
            case 'disconnect':
                await handleDisconnect(ws,data);
                break;
        }
    });

    ws.on('close',()=>{
    console.log('Client Disconnected!');
    })


});


// Core WebSocket Message type and their Hanlders 

const handleJoin = async (ws,data) => {
    const {peerId} = data;

    // Initialize peer's Entry in Peers Dictonary
    peers[peerId] = {
        ws,
        transports :[],
        producers : [],
        consumers : []
    };

    // Respond to a Client after initializing the Peer's Info
    ws.send(JSON.stringify({type:'joined',peerId}));
    console.log(`Peer ${peerId} joined!`)

}


const handleStartScreenShare = async ( ws,data ) => {
    const {peerId,rtpParameters,kind} = data;
    try{
        // create Transport for Teacher..
        const transport = await createTransport(peerId);
        peers[peerId].transports.push(transport);

        // create Producer for teacher and Screen sharing Stream 
        const producer = await createProducer(transport,kind,rtpParameters);
        peers[peerId].producers.push(producer);

        // Notify the Other Clients that a new Screen-Sharing Stream is Avilable.
        broadcastExcept(ws,{
            type:'newScreenShare',
            peerId,
            producerId : producer.id
        });
        console.log(`Screen Sharing Started by ${peerId}`);
    }catch(error){
        console.error("Failed to Start Screen Share! : ",err);
    }
}


server.listen(PORT,()=>{
console.log(`server started at: ${PORT}`);
});


