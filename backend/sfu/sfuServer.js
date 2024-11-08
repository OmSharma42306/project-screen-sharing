const mediasoup = require('mediasoup');

let router;
const peers = {};

const init = async () => {
    // SFU SERVER SETUP
    const worker = await mediasoup.createWorker();
    router = await worker.createRouter({
        mediaCodecs: [
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
            },]
    });
    console.log("SFU SERVER INITIALIZED!");
}


const createTransport = async (peerId) => {
    try {
        const transport = await router.createWebRtcTransport({
            listenIps: [{ ip: '0.0.0.0', announcedIp: '127.0.0.1' }],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });

        // console.log(`Transport Created for peerId ${peerId}:`, {
        //     id: transport.id,
        //     iceParameters: transport.iceParameters,
        //     iceCandidates: transport.iceCandidates,
        //     dtlsParameters: transport.dtlsParameters,
        // });

        if (typeof transport.produce !== "function") {
            console.error("Transport object does not have produce method:", transport);
            throw new Error("Transport creation failed or incompatible Mediasoup version");
        }

        // Store the transport for the peer
        if (!peers[peerId]) {
            peers[peerId] = { transports: [], producers: [], consumers: [] };
        }
        peers[peerId].transports.push(transport);
        return transport;
    } catch (error) {
        console.error("Error in CreateTransport ", error);
        throw error;

    }

};


// Create the Producer for IT! // Example : TEACHER || SCREEN SHARER

const createProducer = async (transport, kind, rtpParameters) => {
    //console.log("Producer Transport Type:", transport.constructor.name); // Should log WebRtcTransport
    const producer = await transport.produce({ kind, rtpParameters });
    return producer;
}

// Create the Receiver for IT! // Example : STUDENTS || SCREEN RECEIVER
const createConsumer = async (transport, producerId, rtpCapabilities) => {
    // console.log("i am from consumer ...")
    // console.log("transport : ", transport)
    // console.log("Producer : ", producerId)


    if (!router.canConsume({ producerId, rtpCapabilities })) {
        throw new Error("Can't Consume the Producer's Idea!")
    }
    const consumer = await transport.consume({ producerId, rtpCapabilities });
    return consumer;
}
module.exports = { init, createTransport, createProducer, createConsumer, getRouter: () => router };