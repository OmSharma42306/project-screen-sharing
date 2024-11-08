////////////////////////////////////////////////////////////////////////////////////////////////////

// import React, { useEffect,useState } from 'react';

// export const TeacherScreenShare = () => {
//     const [producerId, setProducerId] = useState(null);
//     const [rtpParameters, setRtpParameters] = useState(null);
//     const [iceParameters, setIceParameters] = useState(null);
//     const [iceCandidates, setIceCandidates] = useState([]);
//     const [dtlsParameters, setDtlsParameters] = useState(null);
//     useEffect(() => {
//         const ws = new WebSocket('ws://localhost:4000');

//         ws.onopen = () => {
//             console.log("Teacher connected to WebSocket server");
//             startScreenShare(ws);
//         };

//         ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if(data.type === 'screenShareResponse'){

//                  // Expecting a response from the server
//                 console.log("rtpParameters :  kkkkkkkkkkkkkke",data.rtpParameters)
//                  setProducerId(data.producerId);
//                 setRtpParameters(data.rtpParameters);
//                 setIceParameters(data.iceParameters);
//                 setIceCandidates(data.iceCandidates);
//                 setDtlsParameters(data.dtlsParameters);
//                 console.log("Received screen sharing parameters from server:", data);
//             }
//         };


//         const startScreenShare = async (ws) => {
//             try {
//                 const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//                 const track = stream.getTracks()[0];

//                 // Set up basic rtpParameters for  initial screen share setup
//                 const initialRtpParameters  = {
//                     codecs: [
//                         {
//                             mimeType: 'video/VP8',  // Replace as needed, matching server setup
//                             clockRate: 90000,
//                             payloadType: 100,
//                             parameters: {}
//                         }
//                     ],
//                     encodings: [{ ssrc: 12345678 }] // Example; replace with unique SSRC
//                 };

//                  // Wait for WebSocket to be ready before sending 'startScreenShare' event
//                  if(ws.readyState === WebSocket.OPEN){
//                     // Send 'startScreenShare' event with correct rtpParameters
//                 ws.send(JSON.stringify({
//                     type: 'startScreenShare',
//                     peerId: 'teacher',
//                     rtpParameters:initialRtpParameters,
//                     kind: 'video'
//                 }));
//                  }

                

//                  // Send the 'newScreenShare' message to notify about the new screen share stream
//                 //  ws.send(JSON.stringify({
//                 //     type: 'newScreenShare',
//                 //     producerId: 'teacherProducerId', // Replace with actual producer ID once available
//                 //     peerId: 'teacher',  // Teacher ID or peerId
//                 //     rtpParameters: JSON.stringify(rtpParameters), // Pass RTP parameters as a string
//                 //     iceParameters: {},  // Fill in with actual ICE parameters when available
//                 //     iceCandidates: [],  // Fill in with actual ICE candidates
//                 //     dtlsParameters: {}  // Fill in with actual DTLS parameters
//                 // }));

//                 // Handle screen sharing stopping when track ends
//                 track.onended = () => {
//                     if (ws.readyState === WebSocket.OPEN){
//                         ws.send(JSON.stringify({ type: 'stopScreenShare', peerId: 'teacher' }));
//                     }
                    
//                 };
//             } catch (error) {
//                 console.error('Screen Share Error:', error);
//             }
//         };

//         // Once we have received the necessary parameters, notify others
//         if(producerId && rtpParameters && iceParameters && iceCandidates.length > 0 && dtlsParameters){
//             if(ws.readyState === WebSocket.OPEN){
//                 ws.send(JSON.stringify({
//                     type:'newScreenShare',
//                     producerId,
//                     peerId : 'teacher',
//                     rtpParameters : JSON.stringify(rtpParameters),
//                     iceParameters,
//                     iceCandidates,
//                     dtlsParameters
//                 }));
//             }

            
//         }

//         return () => ws.close(); // Clean up WebSocket on component unmount
//     }, [producerId, rtpParameters, iceParameters, iceCandidates, dtlsParameters]);

//     return <div>Hi, I am the Teacher. Screen Sharing is Active.</div>;
// };


import React, { useEffect, useState, useRef } from 'react';

export const TeacherScreenShare = () => {
    const [producerId, setProducerId] = useState(null);
    const [rtpParameters, setRtpParameters] = useState(null);
    const [iceParameters, setIceParameters] = useState(null);
    const [iceCandidates, setIceCandidates] = useState([]);
    const [dtlsParameters, setDtlsParameters] = useState(null);
    const screenShareStarted = useRef(false); // Track if screen sharing is already started

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
            console.log("Teacher connected to WebSocket server");
            if (!screenShareStarted.current) {
                startScreenShare(ws); // Start screen share only once
            }
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'screenShareResponse') {
                // Populate state variables with received parameters
                setProducerId(data.producerId);
                setRtpParameters(data.rtpParameters);
                setIceParameters(data.iceParameters);
                setIceCandidates(data.iceCandidates);
                setDtlsParameters(data.dtlsParameters);
                console.log("Received screen sharing parameters from server:", data);
            }
        };

        const startScreenShare = async (ws) => {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const track = stream.getTracks()[0];
                screenShareStarted.current = true; // Mark screen share as started

                // Initial RTP parameters for screen share
                const initialRtpParameters = {
                    codecs: [{
                        mimeType: 'video/VP8',
                        clockRate: 90000,
                        payloadType: 100,
                        parameters: {}
                    }],
                    encodings: [{ ssrc: 12345678 }]
                };

                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'startScreenShare',
                        peerId: 'teacher',
                        rtpParameters: initialRtpParameters,
                        kind: 'video'
                    }));
                }

                // Handle screen sharing stop when track ends
                track.onended = () => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'stopScreenShare', peerId: 'teacher' }));
                    }
                    screenShareStarted.current = false; // Reset on screen share end
                };
            } catch (error) {
                console.error('Screen Share Error:', error);
            }
        };

        return () => ws.close(); // Clean up WebSocket on component unmount
    }, []); // Remove dependencies to ensure it runs only once on mount

    // Send `newScreenShare` message once parameters are all available
    useEffect(() => {
        if (producerId && rtpParameters && iceParameters && iceCandidates.length > 0 && dtlsParameters) {
            const ws = new WebSocket('ws://localhost:4000'); // Open a new ws connection for this send if needed
            ws.onopen = () => {
                ws.send(JSON.stringify({
                    type: 'newScreenShare',
                    producerId,
                    peerId: 'teacher',
                    rtpParameters: JSON.stringify(rtpParameters),
                    iceParameters,
                    iceCandidates,
                    dtlsParameters
                }));
            };
        }
    }, [producerId, rtpParameters, iceParameters, iceCandidates, dtlsParameters]);

    return <div>Hi, I am the Teacher. Screen Sharing is Active.</div>;
};
