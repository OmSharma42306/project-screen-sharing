const mediasoup = require('mediasoup');

let router;
const peers = {};

const init = async () =>{
    // SFU SERVER SETUP
    const worker = await mediasoup.createWorker();
    router = await worker.createRouter({
        mediaCodecs:[
        {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {},
    },
    {
        kind: 'video',
        mimeType: 'video/H264',
        clockRate: 90000,
        parameters: {
            'level-asymmetry-allowed': 1,
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
        },
    },]});
    console.log("SFU SERVER INITIALIZED!");
}


// createTransport Important Points: 
//The createTransport function is essential for establishing WebRTC connections between peers (like the teacher and students) and the SFU server. This function creates a transport for each peer, enabling them to send and receive media streams through the SFU. Each transport acts as a dedicated pathway for data to flow from the SFU to a specific peer and vice versa.



//Let’s dive into what the createTransport function needs to do to establish these connections.


// const createTransport = async (peerId) =>{
//     const transport = await router.createWebRtcTransport({
//         listenIps: [{ip:'0.0.0.0',announcedIp:'<PUBLIC_IP>'}],
//         enableUdp:true,
//         enableTcp:true,
//         preferUdp:true,
//     })


//     // set maximum incomming bitrate if needed.
//     await transport.setMaxIncomingBitrate(1500000);

//     // strore the transport information in peer's record.
//     peers[peerId] = { transport };

//     // Return transport Parameters to the peer

//     return { 
//         id:transport.id,
//         iceParameters: transport.iceParameters,
//         iceCandidate : transport.iceCandidate,
//         dtlsParameters : transport.dtlsParameters,
// }

// }


const createTransport = async (peerId) => {
    try{
        const transport = await router.createWebRtcTransport({
            listenIps: [{ ip: '0.0.0.0', announcedIp: '<PUBLIC_IP>' }],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });
        console.log("Transport Created:", transport.constructor.name);
        // Check if the transport has a `produce` method and log any issues
        if (typeof transport.produce !== "function") {
            console.error("Transport object does not have produce method:", transport);
            throw new Error("Transport creation failed or incompatible Mediasoup version");
        }
    
        // Store the transport for the peer
        if (!peers[peerId]) {
            peers[peerId] = { transports: [], producers: [], consumers: [] };
        }
        peers[peerId].transports.push(transport);
        console.log(`Transport created for ${peerId}`,transport)
        // return {
        //     id: transport.id,
        //     iceParameters: transport.iceParameters,
        //     iceCandidates: transport.iceCandidates,
        //     dtlsParameters: transport.dtlsParameters
        // };
        return transport;
    }catch(error){
        console.error("Error in CreateTransport ",error);
        throw error;

    }
    
};


// Create the Producer for IT! // Example : TEACHER || SCREEN SHARER

const createProducer = async (transport,kind,rtpParameters) =>{
    console.log("Producer Transport Type:", transport.constructor.name); // Should log WebRtcTransport
    const producer = await transport.produce({kind,rtpParameters});
    return producer;
}

// Create the Receiver for IT! // Example : STUDENTS || SCREEN RECEIVER
const createConsumer = async (transport,producerId,rtpCapabilities) =>{
    if(!router.canConsume({producerId,rtpCapabilities})){
        throw new Error("Can't Consume the Producer's Idea!")
    }
    const consumer = await transport.consume({producerId,rtpCapabilities});
    console.log("ppppppppppppppppppppppp",consumer)
    return consumer;
}


// Handle the Peer Disconnect Handling..

const handleDisconnect = async ( peerId ) =>{
    const peer = peers[peerId];
    if(peer){
        peer.transports.forEach(transport => {
            transport.close();
        });
        peer.producers.forEach(producer => {
            producer.close();
        });

        peer.consumers.forEach(consumer => {
            consumer.close();
        })
        delete peers[peerId]; 
    }

}

module.exports = {init,createTransport,createProducer,createConsumer,getRouter: ()=>router};