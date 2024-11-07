// import React, {useEffect,useRef} from "react";
// import { Device } from 'mediasoup-client';

// const setupDeviceAndJoin = async (ws) => {
//     try {
//         const device = new Device();

//         // Fetch the router RTP capabilities from the server
//         const response = await fetch('http://localhost:4000/rtpCapabilities');
//         const routerRtpCapabilities = await response.json();
//         console.log(routerRtpCapabilities)

//         // Load the device with the router's RTP capabilities
//         await device.load({ routerRtpCapabilities });

//         // Get the client's RTP capabilities
//         const rtpCapabilities = device.rtpCapabilities;

//         // Send the client's RTP capabilities to the server to join
//         ws.send(JSON.stringify({
//             type: 'join',
//             peerId: 'student', // or 'teacher'
//             rtpCapabilities,
//         }));
//     } catch (error) {
//         console.error('Error setting up device:', error);
//     }
// };

// export const StudentsScreenReceiver = () => {
//     const videoRef = useRef(null); 
//     const deviceRef = useRef(null);
//     useEffect(() => {
//         const ws = new WebSocket('ws://localhost:4000');

//         ws.onopen = () => {
//             setupDeviceAndJoin(ws,(device)=>(deviceRef.current = device));
//             console.log("student connected to websocket server");
//         }

//         ws.onmessage = async (event) => {
//             const data = JSON.parse(event.data)
//             console.log("Bhallaladev",data);

//             if(data.type === 'newScreenShare'){
//                 console.log("i ma in the if",data)
//                 const { producerId,id,kind,rtpParameters:rtpParametersJson } = data;
//                 const rtpParameters = rtpParametersJson ? JSON.parse(rtpParametersJson):undefined;
//                 console.log(`Producer id : ${producerId} kind:${kind} rtpParameters:${rtpParameters}`)
//                 console.log("kkkkkeeeeerrrrthhi");

//                 console.log(deviceRef.current)
//                 if (deviceRef.current && kind === 'video'){
                   
//                     try{
                       
//                         // Create a transport to receive the screen share stream
//                         const transport = await deviceRef.current.createRecvTransport({
//                             id:id,
//                             iceParameters : data.iceParameters,
//                             iceCandidates : data.iceCandidates,
//                             dtlsParameters : data.dtlsParameters,
//                         });

                        

//                         // consume the screen share stream.
//                         const consumer = await transport.consume({
//                             id,
//                             producerId,
//                             kind,
//                             rtpParameters
//                         });

//                         // Attach the received stream to the video element.
//                         const stream = new MediaStream();
//                         stream.addTrack(consumer.track);
//                         videoRef.current.srcObject = stream;
//                     }catch(err){
//                         console.error('Error Consuming Screen Share:', err);
//                     }
//                 }
//             }
//         }
//         return () => ws.close(); // cleanup websocket
//     },[])

//     return (
//     <div>
//         <h2>
//             Student View.
//         </h2>
//         <video ref={videoRef} autoPlay playsInline muted />
//     </div>
//     )
// }


import React, { useEffect, useRef } from "react";
import { Device } from 'mediasoup-client';

const setupDeviceAndJoin = async (ws, deviceRef) => {
    try {
        const device = new Device();

        // Fetch the router RTP capabilities from the server
        const response = await fetch('http://localhost:4000/rtpCapabilities');
        const routerRtpCapabilities = await response.json();
        console.log('Fetched routerRtpCapabilities:', routerRtpCapabilities);

        // Load the device with the router's RTP capabilities
        await device.load({ routerRtpCapabilities });

        // Set deviceRef.current to the loaded device
        deviceRef.current = device;

        // Get the client's RTP capabilities
        const rtpCapabilities = device.rtpCapabilities;

        // Send the client's RTP capabilities to the server to join
        ws.send(JSON.stringify({
            type: 'join',
            peerId: 'student',
            rtpCapabilities,
        }));

        console.log("Device setup complete:", device);
    } catch (error) {
        console.error('Error setting up device:', error);
    }
};

export const StudentsScreenReceiver = () => {
    const videoRef = useRef(null);
    const deviceRef = useRef(null);
    const messageQueue = useRef([]);  // Queue to hold WebSocket messages

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
            setupDeviceAndJoin(ws, deviceRef);
            console.log("Student connected to WebSocket server");
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            // Queue the message if deviceRef.current is not yet ready
            if (!deviceRef.current) {
                messageQueue.current.push(data);
                return;
            }

            // Process the message directly if deviceRef.current is ready
            await handleScreenShareMessage(data);
        };

        // Function to handle screen share messages
        const handleScreenShareMessage = async (data) => {
            if (data.type === 'newScreenShare') {
                const { producerId, kind, rtpParameters: rtpParametersJson } = data;
                const rtpParameters = rtpParametersJson ? JSON.parse(rtpParametersJson) : undefined;
                console.log("id",data.peerId)
                console.log(`Producer id: ${producerId}, kind: ${kind}, rtpParameters: ${JSON.stringify(rtpParameters, null, 2)}`);

                if (deviceRef.current && kind === 'video') {
                    try {
                        console.log("hiiiiiiiiiiiiiiiii")
                        // Create a transport to receive the screen share stream
                        const transport = await deviceRef.current.createRecvTransport({
                            id: data.peerId,
                            iceParameters: data.iceParameters,
                            iceCandidates: data.iceCandidates,
                            dtlsParameters: data.dtlsParameters,
                        });

                              // Add the required 'connect' listener to the transport
                transport.on('connect', ({ dtlsParameters }, callback, errback) => {
                    // Send the DTLS parameters to the server to complete the connection
                    ws.send(JSON.stringify({
                        type: 'connectTransport',
                        transportId: transport.id,
                        dtlsParameters
                    }));

                    // Use callback to signal success, errback for failure
                    ws.onmessage = (event) => {
                        const response = JSON.parse(event.data);
                        if (response.type === 'connectTransportSuccess') {
                            callback();
                        } else if (response.type === 'connectTransportError') {
                            errback(new Error('Failed to connect transport on server'));
                        }
                    };
                });


                        // Consume the screen share stream
                        const consumer = await transport.consume({
                            id: data.peerId,
                            producerId,
                            kind,
                            rtpParameters
                        });

                        // Attach the received stream to the video element
                        const stream = new MediaStream();
                        stream.addTrack(consumer.track);
                        videoRef.current.srcObject = stream;
                    } catch (err) {
                        console.error('Error Consuming Screen Share:', err);
                    }
                }
            }
        };

        // Process any queued messages once deviceRef.current is ready
        const processQueuedMessages = () => {
            while (messageQueue.current.length > 0) {
                const message = messageQueue.current.shift();
                handleScreenShareMessage(message);
            }
        };

        // Watch deviceRef to process queued messages as soon as device is ready
        useEffect(() => {
            if (deviceRef.current) {
                processQueuedMessages();
            }
        }, [deviceRef.current]);

        return () => ws.close(); // Cleanup WebSocket on component unmount
    }, []);

    return (
        <div>
            <h2>Student View</h2>
            <video ref={videoRef} autoPlay controls />
        </div>
    );
};
