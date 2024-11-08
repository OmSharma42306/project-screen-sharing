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
let transportMap = {}; // New dictionary for transport lookup

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
                //console.log("Received newScreenShare message:", data);  // Log full 
                await handleNewScreenShare(ws, data);
                break;

            case 'connectTransport':
                await handleConnectTransport(ws,data);
                break;
            
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
    // here rtpCapabilites expected only for student .. not for teacher .

    // Initialize peer's entry in the peers dictionary if not already present
    if (!peers[peerId]) {
        peers[peerId] = {
    
            ws,
            transports: [],
            producers: [],
            consumers: [],
            rtpCapabilities // Store rtpCapabilities for the student,chek mad vamme,,,,,,,,,,,,,,,,
        };
        console.log("added this to peer object",peerId)
    }

    // Respond to the client after initializing the peer's info
    ws.send(JSON.stringify({ type: 'joined', peerId }));
    // Check if there is an active screen share to send immediately to the student
    const teacher = peers['teacher'];
    if (teacher && teacher.producers.length > 0) {
        const producer = teacher.producers[0];
        ws.send(JSON.stringify({
            type: 'newScreenShare',
            peerId: 'teacher',
            producerId: producer.id,
            kind: producer.kind,
            rtpParameters: JSON.stringify(producer.rtpParameters),
            iceParameters: teacher.transports[0].iceParameters,
            iceCandidates: teacher.transports[0].iceCandidates,
            dtlsParameters: teacher.transports[0].dtlsParameters
        }));
    }
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
          // Check if producerId is available after creating transport
          if (!transport.id) {
            console.error("Failed to create transport ID; transport creation error.");
            return;
        }
         // Log transport creation and addition to transportMap
         console.log(`Created transport with ID ${transport.id} for peerId: ${peerId}`);
        peers[peerId].transports.push(transport);
        transportMap[transport.id] = { peerId, transport }; // Add to transportMap
        console.log(`Added transport with ID ${transport.id} to transportMap for producerId: ${transport.id}`);
      //  console.log("checkingPEEEEEEEEEEEEEEEEEERS",peers[peerId])

        // Create producer for screen sharing stream
        const producer = await createProducer(transport, kind, rtpParameters);
        peers[peerId].producers.push(producer);

        // Confirm that producer ID is correct
        if (!producer.id) {
            console.error("Failed to create producer ID; producer creation error.");
            return;
        }
        // console.log("After pushing producers peers dictonary : ",peers[peerId]);
        // console.log("Producers ID ",producer.id)
        // console.log("rtpParameters",producer.rtpParameters);
        console.log(`Producer created with ID ${producer.id} for peerId: ${peerId}`);

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
    const studentId = "student"; // Ensure you have the correct student ID here // focus logic here,,
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

    console.log(peers);
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
    console.log("i am in connecttransport")
    const { producerId,dtlsParameters} = data;
    console.log("i am at handleConnectTransport")
    console.log("Producer ID ", producerId);
    // console.log("dtlsParamters,",dtlsParameters)


    // Look up the transport and peerId directly
    const transportEntry = transportMap[producerId];
    if (!transportEntry) {
        console.warn(`Transport with producerId ${producerId} not found in transportMap.`);
        // Log entire transportMap to inspect its contents
        console.log("Current transportMap:", transportMap);
        return;
        
    }
    const { peerId, transport } = transportEntry;
    // try{
    //     // find the transport in the peers dictonary
    //     let transport;
    //     console.log("PEERS: ",peers);
    //     for (const peerId in peers){
    //         //console.log("PEER ID ",peerId)
    //         const peer = peers[peerId];
    //         console.log("PEER",peer)
    //         transport = peer.transports.find((t)=>t.id === producerId);
    //         console.log("transporrrrrrrrrrrrrrrrrrr",transport)
    //     //    console.log("Peers dictonary...............",peers)
    //         if(transport){
    //             console.log("i am in transport ")
    //                break; 
    //         }}

    //         if(!transport){
    //             console.warn(`Transport with ID ${producerId} not found`);
    //             return;
    //         }

    //         // connect the transport with the provided DTLS parameters
    //         await transport.connect({dtlsParameters});

    //         // notify the clients that the transport is connected!
    //         ws.send(JSON.stringify({type:'connectTransportSuccess'}));
    //         console.log(`Transport ${producerId} connected successfully!`);
        
    // }catch(error){
    //     console.error('Error connecting transport:', error);
    //     ws.send(JSON.stringify({ type: 'connectTransportError', error: error.message }));
    // }

    try {
        await transport.connect({ dtlsParameters });
        ws.send(JSON.stringify({ type: 'connectTransportSuccess' }));
        console.log(`Transport ${producerId} connected successfully for peer ${peerId}`);
    } catch (error) {
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
        rtpParameters: consumer.rtpParameters,
        transportId : transport.id
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



(async () => {
    await init();  // Wait for the router to initialize
    server.listen(PORT, () => {
        console.log(`Server started on port: ${PORT}`);
    });
})();