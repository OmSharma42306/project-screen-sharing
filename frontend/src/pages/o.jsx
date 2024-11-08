// import React, { useEffect,useRef } from "react";
// import {io} from 'socket.io-client'

// export const StudentsScreenReceiver = () => {
//     const videoRef = useRef(null);
//     const socket = io('http://localhost:4000');

//     useEffect(()=>{
//         socket.on('screen-track',track => {
//             console.log('Received track from server',track)
//             videoRef.current.srcObject= new MediaStream([track]);
//             videoRef.current.play();
//         });
//         return () => socket.off('screen-track');
//     },[])
//     return <video ref={videoRef} autoPlay controls/>
// }

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


// StudentsScreenReceiver.jsx
import React, { useEffect, useRef } from 'react';

export const StudentsScreenReceiver = () => {
    const videoRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => console.log("Student connected to WebSocket server");

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'newScreenShare') {
                // Handle incoming screen share (replace with actual media stream handling)
                console.log("New screen sharing started by:", data.peerId);
            } else if (data.type === 'screenShareStopped') {
                console.log("Screen sharing stopped by:", data.peerId);
                if (videoRef.current) {
                    videoRef.current.srcObject = null;
                }
            }
        };

        return () => ws.close(); // Clean up WebSocket on component unmount
    }, []);

    return <video ref={videoRef} autoPlay controls />;
};

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, { useEffect, useRef } from 'react';
// import * as mediasoupClient from "mediasoup-client";
// export const StudentsScreenReceiver = () => {
//     const videoRef = useRef(null);
//     const pcRef = useRef(null); // Store RTCPeerConnection

//     useEffect(() => {
//         const ws = new WebSocket('ws://localhost:4000');

//         ws.onopen = () => console.log("Student connected to WebSocket server");

//         ws.onmessage = async (event) => {
//             const data = JSON.parse(event.data);

//             if (data.type === 'newScreenShare') {
//                 const { rtpParameters, kind } = data;
                
//                 if (!pcRef.current) {
//                     pcRef.current = new RTCPeerConnection({
//                         iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] // Use STUN servers
//                     });

//                     pcRef.current.ontrack = (event) => {
//                         videoRef.current.srcObject = event.streams[0];
//                     };
//                 }

//                 const consumerTransceiver = await pcRef.current.addTransceiver(kind, {
//                     direction: 'recvonly'
//                 });

//                 await pcRef.current.setRemoteDescription(new RTCSessionDescription({
//                     type: 'offer',
//                     sdp: rtpParameters.sdp
//                 }));

//                 const answer = await pcRef.current.createAnswer();
//                 await pcRef.current.setLocalDescription(answer);

//                 // Send answer back to server
//                 ws.send(JSON.stringify({
//                     type: 'screenShareAnswer',
//                     sdp: pcRef.current.localDescription.sdp
//                 }));
//             } else if (data.type === 'screenShareStopped') {
//                 console.log("Screen sharing stopped by:", data.peerId);
//                 if (videoRef.current) {
//                     videoRef.current.srcObject = null;
//                 }
//             }
//         };

//         return () => {
//             ws.close();
//             if (pcRef.current) pcRef.current.close();
//         }; // Clean up WebSocket and peer connection on unmount
//     }, []);

//     return <video ref={videoRef} autoPlay controls />;
// };




////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
// import React, { useEffect, useRef } from 'react';
// import * as mediasoupClient from 'mediasoup-client';

// export const StudentsScreenReceiver = () => {
//     const videoRef = useRef(null);
//     const deviceRef = useRef(null); // Store mediasoup-client Device instance
//     const consumerTransportRef = useRef(null);
//     const consumerRef = useRef(null);

//     useEffect(() => {
//         const ws = new WebSocket('ws://localhost:4000');

//         ws.onopen = () => console.log("Student connected to WebSocket server");

//         ws.onmessage = async (event) => {
//             const data = JSON.parse(event.data);

//             if (data.type === 'newScreenShare') {
//                 const { rtpParameters, kind } = data;

//                 if (!deviceRef.current) {
//                     // Initialize mediasoup-client Device if not already done
//                     deviceRef.current = new mediasoupClient.Device();
//                     await deviceRef.current.load({ routerRtpCapabilities: data.routerRtpCapabilities });
//                 }

//                 // Create transport if not already done
//                 if (!consumerTransportRef.current) {
//                      console.log("i am in consumer t")
//                     consumerTransportRef.current = await deviceRef.current.createRecvTransport(data.transportOptions);

//                     consumerTransportRef.current.on('connect', ({ dtlsParameters }, callback, errback) => {
//                         ws.send(JSON.stringify({
//                             type: 'connectConsumerTransport',
//                             dtlsParameters,
//                         }));
//                         callback(); // Signal completion
//                     });
//                 }

//                 // Create the consumer for the screen share
//                 consumerRef.current = await consumerTransportRef.current.consume({
//                     id: data.id,
//                     producerId: data.producerId,
//                     kind: kind,
//                     rtpParameters: rtpParameters,
//                 });

//                 const stream = new MediaStream();
//                 stream.addTrack(consumerRef.current.track);
//                 videoRef.current.srcObject = stream;
//                 videoRef.current.play();
//             } else if (data.type === 'screenShareStopped') {
//                 console.log("Screen sharing stopped by:", data.peerId);
//                 if (videoRef.current) {
//                     videoRef.current.srcObject = null;
//                 }
//                 // Close and cleanup consumer
//                 if (consumerRef.current) {
//                     consumerRef.current.close();
//                     consumerRef.current = null;
//                 }
//             }
//         };

//         return () => {
//             ws.close();
//             if (consumerTransportRef.current) consumerTransportRef.current.close();
//             if (consumerRef.current) consumerRef.current.close();
//         };
//     }, []);

//     return <video ref={videoRef} autoPlay controls />;
// };


// import React, { useEffect, useRef } from 'react';
// import * as mediasoupClient from 'mediasoup-client';

// export const StudentsScreenReceiver = () => {
//     const videoRef = useRef(null);
//     const deviceRef = useRef(null); // Store mediasoup-client Device instance
//     const consumerTransportRef = useRef(null);
//     const consumerRef = useRef(null);
//     const wsRef = useRef(null); // Store the WebSocket instance

//     useEffect(() => {
//         // Create WebSocket connection
//         wsRef.current = new WebSocket('ws://localhost:4000');

//         wsRef.current.onopen = () => {
//             console.log("Student connected to WebSocket server");
//             // Send join request with peerId and any required rtpCapabilities
//             wsRef.current.send(JSON.stringify({
//                 type: 'join',
//                 peerId: 'studentId', // Change this to a unique ID for each student
//                 rtpCapabilities: {} // Add the actual rtpCapabilities if needed
//             }));
//         };

//         wsRef.current.onmessage = async (event) => {
//             const data = JSON.parse(event.data);
//             console.log("Received WebSocket message:", data);
//             if (data.type === 'newScreenShare') {
//                 const { rtpParameters, kind, producerId } = data;
//                 console.log("i am in the if condiiton")
//                 // Check if the device has been initialized
//                 if (!deviceRef.current) {
//                     // Initialize mediasoup-client Device if not already done
//                     deviceRef.current = new mediasoupClient.Device();
//                     // You need to get the routerRtpCapabilities from the server when initializing
//                     await deviceRef.current.load({ routerRtpCapabilities: data.routerRtpCapabilities });
//                     console.log("Loaded mediasoup device with capabilities:", data.routerRtpCapabilities);
//                 }

//                 // Create transport if not already done
//                 if (!consumerTransportRef.current) {
//                     // Create receive transport with options received from server
//                     consumerTransportRef.current = await deviceRef.current.createRecvTransport(data.transportOptions);

//                     consumerTransportRef.current.on('connect', ({ dtlsParameters }, callback, errback) => {
//                         wsRef.current.send(JSON.stringify({
//                             type: 'connectConsumerTransport',
//                             dtlsParameters,
//                         }));
//                         callback(); // Signal completion
//                     });
//                 }

//                 // Create the consumer for the screen share
//                 consumerRef.current = await consumerTransportRef.current.consume({
//                     id: data.id,
//                     producerId: producerId,
//                     kind: kind,
//                     rtpParameters: rtpParameters,
//                 });
//                 console.log("Consumer created:", consumerRef.current);
//                 const stream = new MediaStream();
//                 stream.addTrack(consumerRef.current.track);
//                 videoRef.current.srcObject = stream;
//                 videoRef.current.play();
//             } else if (data.type === 'screenShareStopped') {
//                 console.log("Screen sharing stopped by:", data.peerId);
//                 if (videoRef.current) {
//                     videoRef.current.srcObject = null;
//                 }
//                 // Close and cleanup consumer
//                 if (consumerRef.current) {
//                     consumerRef.current.close();
//                     consumerRef.current = null;
//                 }
//             }
//         };

//         return () => {
//             wsRef.current.close(); // Close WebSocket on component unmount
//             if (consumerTransportRef.current) consumerTransportRef.current.close();
//             if (consumerRef.current) consumerRef.current.close();
//         };
//     }, []);

//     return <video ref={videoRef} autoPlay controls />;
// };
