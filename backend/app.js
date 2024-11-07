// //  express: Imports the Express framework for creating a basic web server.
// //  http: Imports the built-in Node.js HTTP module for creating an HTTP server.
// // socketIo: Imports the Socket.IO library for real-time communication between the server and web clients.
// // mediasoup: Imports the mediasoup library for handling WebRTC media processing.
// // mediasoupConfig: Imports a separate configuration file (./config/mediasoupConfig) containing options for mediasoup, like media codecs and WebRTC transport settings.

// const http = require('http')
// const express = require('express');
// const cors = require('cors');
// const sfuServer = require('./sfu/sfuServer')
// const {createTransport} = require('./sfu/sfuServer');
// const {createProducer} = require('./sfu/sfuServer');
// const {createConsumer} = require('./sfu/sfuServer');
// const {init} = require('./sfu/sfuServer');
// const Websocket = require('ws')
// const bodyParser = require('body-parser')
// const PORT = 4000;
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());

// const server = http.createServer(app);
// const wss = new Websocket.Server({ server });

// let peers = {};

// // Initialize the SFU Server
// init();

// wss.on('connection',(ws) => {
//     console.log('new client connected!');

//     // handle messages from clients.

//     ws.on('message',async(message) => {
//         const data = JSON.parse(message);

//         switch(data.type){
//             case 'join':
//                 await handleJoin(ws,data);
//                 break;
            
//             case 'startScreenShare':
//                 await handleStartScreenShare(ws,data);
//                 break;
            
//             case 'stopScreenShare':
//                 await handleStopScreenShare(ws,data);
//                 break;
            
//             case 'disconnect':
//                 await handleDisconnect(ws,data);
//                 break;
//         }
//     });

//     ws.on('close',()=>{
//     console.log('Client Disconnected!');
//     })


// });


// // Core WebSocket Message type and their Hanlders 

// const handleJoin = async (ws,data) => {
//     const {peerId} = data;

//     // Initialize peer's Entry in Peers Dictonary
//     peers[peerId] = {
//         ws,
//         transports :[],
//         producers : [],
//         consumers : []
//     };

//     // Respond to a Client after initializing the Peer's Info
//     ws.send(JSON.stringify({type:'joined',peerId}));
//     console.log(`Peer ${peerId} joined!`)

// }


// const handleStartScreenShare = async ( ws,data ) => {
//     console.log("PEERS",peers)
//     console.log("handlestart",data);
//     const {peerId,rtpParameters,kind} = data;
//     try{
//         // create Transport for Teacher..
//         const transport = await createTransport(peerId);
//         peers[peerId].transports.push(transport);

//         // create Producer for teacher and Screen sharing Stream 
//         const producer = await createProducer(transport,kind,rtpParameters);
//         peers[peerId].producers.push(producer);

//         // Notify the Other Clients that a new Screen-Sharing Stream is Avilable.
//         broadcastExcept(ws,{
//             type:'newScreenShare',
//             peerId,
//             producerId : producer.id
//         });
//         console.log(`Screen Sharing Started by ${peerId}`);
//     }catch(error){
//         console.error("Failed to Start Screen Share! : ",error);
//     }
// }

// const handleStopScreenShare = async ( ws,data ) => {
//     const {peerId} = data;
//     const peer = peers[peerId];
//     if(peer){
//         peer.producers.forEach(producer => {
//         producer.close();            
//         });
//         peer.producers = [];

//         // Notify the all other clients that screen Sharing has stopped.
//         broadcastExcept(ws,{type: 'screenShareStopped',peerId});
//         console.log(`Screen Share Stopped by ${peerId}`)
//     }
// }

// // BroadCasting to All Peers except Sender

// const broadcastExcept = (senderWs,message) => {
//     wss.clients.forEach((client) => {
//         if(client !== senderWs && client.readyState === Websocket.OPEN ){
//             client.send(JSON.stringify(message));
//         }
//     });
// };

// server.listen(PORT,()=>{
// console.log(`server started at: ${PORT}`);
// });

////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

const http = require('http');
const express = require('express');
const cors = require('cors');
const Websocket = require('ws');
const bodyParser = require('body-parser');
const { init, createTransport, createProducer, createConsumer,getRouter } = require('./sfu/sfuServer');
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

app.get('/rtpCapabilities', (req, res) => {
    const router = getRouter();
    if (router) {
        res.json(router.rtpCapabilities);
    } else {
        res.status(500).send("Router not initialized");
    }
});
wss.on('connection', (ws) => {
    console.log('New client connected!');

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        console.log("Received message of type:", data.type);  // Add this to log each message type

        switch (data.type) {
            case 'join':
                await handleJoin(ws, data);
                break;
            
            case 'startScreenShare':
                await handleStartScreenShare(ws, data);
                break;
            
            case 'stopScreenShare':
                await handleStopScreenShare(ws, data);
                break;
            
            case 'consumeScreenShare':
                await handleConsumeScreenShare(ws, data);
                break;

            //case 'requestScreenShareConsumer':  // New case for requesting the screen share stream
            case 'newScreenShare':
                console.log("Received newScreenShare message:", data);  // Log full 
                await handleNewScreenShare(ws, data);
                break;

            case 'connectTransport':
                await handleConnectTransport(ws,data);
            
            case 'disconnect':
                await handleDisconnect(data.peerId);
                break;
            
            default:
                console.warn(`Unhandled message type: ${data.type}`);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected!');
    });
});

// Handle Join
const handleJoin = async (ws, data) => {
    const { peerId,rtpCapabilities  } = data;

    // Initialize peer's entry in the peers dictionary if not already present
    if (!peers[peerId]) {
        peers[peerId] = {
            ws,
            transports: [],
            producers: [],
            consumers: [],
            rtpCapabilities // Store rtpCapabilities for the student
        };
    }

    // Respond to the client after initializing the peer's info
    ws.send(JSON.stringify({ type: 'joined', peerId }));
    console.log(`Peer ${peerId} joined!`);
    //console.log(`Peer ${peerId} joined with RTP Capabilities:`, rtpCapabilities);
};

// Handle Start Screen Share
const handleStartScreenShare = async (ws, data) => {
    
    const { peerId, rtpParameters, kind } = data;
    //console.log(` PEER ID : ${peerId} RTPPARAMETERS : ${JSON.stringify(rtpParameters,null,2)} KIND : ${kind}`)
    console.log(`Starting screen share for teacher with peerId: ${peerId}`);
    
    // Ensure peer exists in peers dictionary
    if (!peers[peerId]) {
        console.warn(`Peer ${peerId} not found. Please ensure 'join' is called first.`);
        await handleJoin(ws, { peerId });
    }

    try {
        if (!kind) {
            throw new Error("Kind is undefined in handleStartScreenShare");
        }
        // Create transport for screen sharing
        const transport = await createTransport(peerId);
        console.log("Om KEERTHI SHARMA",transport)
        console.log("Transport Type:", transport.constructor.name);

        peers[peerId].transports.push(transport);
      //  console.log("checkingPEEEEEEEEEEEEEEEEEERS",peers[peerId])

        // Create producer for screen sharing stream
        const producer = await createProducer(transport, kind, rtpParameters);
        peers[peerId].producers.push(producer);

        ws.send(JSON.stringify({
            type : 'screenShareResponse',
            producerId : producer.id,
            rtpParameters : producer.rtpParameters,
            iceParameters : transport.iceParameters,
            iceCandidates : transport.iceCandidates,
            dtlsParameters : transport.dtlsParameters

        }));

        // Notify other clients about the new screen-sharing stream
        broadcastExcept(ws, {
            type: 'newScreenShare',
            peerId,
            producerId: producer.id,
            kind,
            rtpParameters: JSON.stringify(rtpParameters),
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
        });
        console.log(`Screen sharing started by ${peerId}`);
    } catch (error) {
        console.error("Failed to start screen share:", error);
    }
};

// Handle Stop Screen Share
const handleStopScreenShare = async (ws, data) => {
    const { peerId } = data;
    const peer = peers[peerId];

    if (peer) {
        peer.producers.forEach(producer => {
            producer.close();
        });
        peer.producers = [];

        // Notify all other clients that screen sharing has stopped
        broadcastExcept(ws, { type: 'screenShareStopped', peerId });
        console.log(`Screen share stopped by ${peerId}`);
    } else {
        console.warn(`No active peer found with peerId: ${peerId}`);
    }
};

// Handle Peer Disconnection
const handleDisconnect = async (peerId) => {
    const peer = peers[peerId];
    if (peer) {
        peer.transports.forEach(transport => transport.close());
        peer.producers.forEach(producer => producer.close());
        peer.consumers.forEach(consumer => consumer.close());
        
        delete peers[peerId];
        console.log(`Peer ${peerId} disconnected and resources cleaned up.`);
    } else {
        console.warn(`Attempted to disconnect non-existent peer with peerId: ${peerId}`);
    }
};

// TO GET THE STREAM OF SCREEN SHARER , e.g teacher to student

const handleNewScreenShare = async (ws,data) => {
    console.log("I am in handlenewScreenshare");
    const {producerId,peerId} = data;
    console.log(data)
    const studentId = "student"; // Ensure you have the correct student ID here
    const studentPeer = peers[studentId];
    

    if (!studentPeer) {
        console.warn(`Student with id ${studentId} not found.`);
        return;
    }
    console.log(`Sending consumeScreenShare to student ${studentId} with producerId: ${producerId}`);

    const transport = await createTransport(studentId);
    const rtpCapabilities = studentPeer.rtpCapabilities;
    console.log("studentside transports...............",transport)
    console.log("studentside rtpCapabilities...............",rtpCapabilities)
    const consumer = await createConsumer(transport,producerId,rtpCapabilities);
    console.log("Created transport for student:", transport.id); // Log transport ID for confirmation
    peers[studentId].transports.push(transport);
    peers[studentId].consumers.push(consumer);

    ws.send(JSON.stringify({
        type: 'consumeScreenShare',
        producerId,
        id:consumer.id,
        kind:consumer.kind,
        //rtpParameters:consumer.rtpParameters,
        rtpCapabilities,
        transportId: transport.id,  // Make sure the transportId is included
       // routerRtpCapabilities: router.rtpCapabilities, // Send RTP capabilities to students

        
    }))
}

// handleConnectTransport

const handleConnectTransport = async ( ws,data ) => {
    //console.log("i am dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",data)
    const { producerId,dtlsParameters} = data;
    //console.log(`Received connectTransport message for transport ${ producerId} with DTLS parameters:`, dtlsParameters);

    try{
        // find the transport in the peers dictonary
        let transport;
        for (const peerId in peers){
            const peer = peers[peerId];
            transport = peer.transports.find((t)=>t.id === producerId);
      //      console.log("transporrrrrrrrrrrrrrrrrrr",transport)
        //    console.log("Peers dictonary...............",peers)
            if(transport){
                   break; 
            }}

            if(!transport){
                console.warn(`Transport with ID ${producerId} not found`);
                return;
            }

            // connect the transport with the provided DTLS parameters
            await transport.connect({dtlsParameters});

            // notify the clients that the transport is connected!
            ws.send(JSON.stringify({type:'connectTransportSuccess'}));
            console.log(`Transport ${producerId} connected successfully!`);
        
    }catch(error){
        console.error('Error connecting transport:', error);
        ws.send(JSON.stringify({ type: 'connectTransportError', error: error.message }));
    }
}

// Handle Consumer Creation for Screen Sharing
const handleConsumeScreenShare = async (ws, data) => {
    const { producerId, peerId, rtpCapabilities } = data;

    const studentPeer = peers[peerId];
    if (!studentPeer) {
        console.warn(`Student with id ${peerId} not found.`);
        return;
    }

    // Create a transport for the consumer if it doesn’t already exist
    const transport = await createTransport(peerId);
    studentPeer.transports.push(transport);

    // Use rtpCapabilities provided by the student to create the consumer
    const consumer = await createConsumer(transport, producerId, rtpCapabilities);
    studentPeer.consumers.push(consumer);

    ws.send(JSON.stringify({
        type: 'consumeScreenShare',
        producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
    }));
};




// Broadcast message to all clients except sender
const broadcastExcept = (senderWs, message) => {
    wss.clients.forEach((client) => {
        if (client !== senderWs && client.readyState === Websocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

// Start server
// server.listen(PORT, () => {
//     console.log(`Server started on port: ${PORT}`);
// });

(async () => {
    await init();  // Wait for the router to initialize
    server.listen(PORT, () => {
        console.log(`Server started on port: ${PORT}`);
    });
})();

////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

// const http = require('http');
// const express = require('express');
// const cors = require('cors');
// const WebSocket = require('ws');
// const bodyParser = require('body-parser');
// const { init, createTransport, createProducer, createConsumer } = require('./sfu/sfuServer');

// const PORT = 4000;
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(bodyParser.json());

// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });
// let peers = {};

// // Initialize the SFU Server
// init();

// wss.on('connection', (ws) => {
//     console.log('New client connected!');

//     ws.on('message', async (message) => {
//         const data = JSON.parse(message);

//         switch (data.type) {
//             case 'join':
//                 await handleJoin(ws, data);
//                 break;
            
//             case 'startScreenShare':
//                 await handleStartScreenShare(ws, data);
//                 break;
            
//             case 'stopScreenShare':
//                 await handleStopScreenShare(ws, data);
//                 break;
            
//             case 'consumeScreenShare':
//                 await handleConsumeScreenShare(ws, data);
//                 break;
            
//             case 'disconnect':
//                 await handleDisconnect(data.peerId);
//                 break;
            
//             default:
//                 console.warn(`Unhandled message type: ${data.type}`);
//         }
//     });

//     ws.on('close', () => {
//         console.log('Client disconnected!');
//     });
// });

// // Handle Join
// const handleJoin = async (ws, data) => {
//     const { peerId, rtpCapabilities } = data;

//     // Initialize peer's entry in the peers dictionary if not already present
//     if (!peers[peerId]) {
//         peers[peerId] = {
//             ws,
//             transports: [],
//             producers: [],
//             consumers: [],
//             rtpCapabilities
//         };
//     }

//     // Respond to the client after initializing the peer's info
//     ws.send(JSON.stringify({ type: 'joined', peerId, routerRtpCapabilities: init.getRouterRtpCapabilities() }));
//     console.log(`Peer ${peerId} joined!`);
// };

// // Handle Start Screen Share
// const handleStartScreenShare = async (ws, data) => {
//     const { peerId, rtpParameters, kind } = data;

//     if (!peers[peerId]) {
//         console.warn(`Peer ${peerId} not found. Please ensure 'join' is called first.`);
//         await handleJoin(ws, { peerId });
//     }

//     try {
//         if (!kind) throw new Error("Kind is undefined in handleStartScreenShare");

//         // Create transport for screen sharing
//         const transport = await createTransport(peerId);
//         peers[peerId].transports.push(transport);

//         // Create producer for screen sharing stream
//         const producer = await createProducer(transport, kind, rtpParameters);
//         peers[peerId].producers.push(producer);

//         // Notify other clients about the new screen-sharing stream
//         broadcastExcept(ws, {
//             type: 'newScreenShare',
//             peerId,
//             producerId: producer.id
//         });
//         console.log(`Screen sharing started by ${peerId}`);
//     } catch (error) {
//         console.error("Failed to start screen share:", error);
//     }
// };

// // Handle Stop Screen Share
// const handleStopScreenShare = async (ws, data) => {
//     const { peerId } = data;
//     const peer = peers[peerId];

//     if (peer) {
//         peer.producers.forEach(producer => producer.close());
//         peer.producers = [];

//         // Notify all other clients that screen sharing has stopped
//         broadcastExcept(ws, { type: 'screenShareStopped', peerId });
//         console.log(`Screen share stopped by ${peerId}`);
//     } else {
//         console.warn(`No active peer found with peerId: ${peerId}`);
//     }
// };

// // Handle Peer Disconnection
// const handleDisconnect = async (peerId) => {
//     const peer = peers[peerId];
//     if (peer) {
//         peer.transports.forEach(transport => transport.close());
//         peer.producers.forEach(producer => producer.close());
//         peer.consumers.forEach(consumer => consumer.close());
        
//         delete peers[peerId];
//         console.log(`Peer ${peerId} disconnected and resources cleaned up.`);
//     } else {
//         console.warn(`Attempted to disconnect non-existent peer with peerId: ${peerId}`);
//     }
// };

// // Handle Consumer Creation for Screen Sharing
// const handleConsumeScreenShare = async (ws, data) => {
//     const { producerId, peerId, rtpCapabilities } = data;

//     const studentPeer = peers[peerId];
//     if (!studentPeer) {
//         console.warn(`Student with id ${peerId} not found.`);
//         return;
//     }

//     // Create a transport for the consumer if it doesn’t already exist
//     const transport = await createTransport(peerId);
//     studentPeer.transports.push(transport);

//     // Use rtpCapabilities provided by the student to create the consumer
//     const consumer = await createConsumer(transport, producerId, rtpCapabilities);
//     studentPeer.consumers.push(consumer);

//     ws.send(JSON.stringify({
//         type: 'consumeScreenShare',
//         producerId,
//         id: consumer.id,
//         kind: consumer.kind,
//         rtpParameters: consumer.rtpParameters
//     }));
// };

// // Broadcast message to all clients except sender
// const broadcastExcept = (senderWs, message) => {
//     wss.clients.forEach((client) => {
//         if (client !== senderWs && client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify(message));
//         }
//     });
// };

// // Start server
// server.listen(PORT, () => {
//     console.log(`Server started on port: ${PORT}`);
// });
