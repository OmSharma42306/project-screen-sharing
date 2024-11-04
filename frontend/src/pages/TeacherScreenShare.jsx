// import React, { useEffect } from 'react';
// import {io} from 'socket.io-client';
// export const TeacherScreenShare = () =>{
//     const socket = io('http://localhost:4000');

//     useEffect(()=>{
//         const startScreenShare = async () => {
//             try{
//                 const stream = await navigator.mediaDevices.getDisplayMedia({video:true});
//                 stream.getTracks().forEach(track =>{
//                     console.log('Sending Screen Tracks to server:',track)
//                     socket.emit('screen-track',track);
//                 });
//                 sender.onended = () => socket.emit('screen-share-ended'); // Handle end of share
//             }catch(error){
//                 console.error('Screen Share Error: ',error)
//             }
//         }
//         startScreenShare();
//     },[])
//     return <div>
//         Hi i am Teacher,Screen Sharing Active


//     </div>
// }


// TeacherScreenShare.jsx

// import React, { useEffect } from 'react';

// export const TeacherScreenShare = () => {
//     useEffect(() => {
//         const ws = new WebSocket('ws://localhost:4000');

//         ws.onopen = () => {
//             console.log("Teacher connected to WebSocket server");
//             startScreenShare(ws);
//         };

//         const startScreenShare = async (ws) => {
//             try {
//                 const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
//                 const track = stream.getTracks()[0];

//                 // Send a 'startScreenShare' event
//                 ws.send(JSON.stringify({
//                     type: 'startScreenShare',
//                     peerId: 'teacher',
//                     rtpParameters : track.getSettings(), // This would be replaced by actual rtpParameters from mediasoup on a real setup
//                     kind: 'video'
//                 }));

//                 // Use track data to share with students
//                 track.onended = () => {
//                     ws.send(JSON.stringify({ type: 'stopScreenShare', peerId: 'teacher' }));
//                 };
//             } catch (error) {
//                 console.error('Screen Share Error:', error);
//             }
//         };

//         return () => ws.close(); // Clean up WebSocket on component unmount
//     }, []);

//     return <div>Hi, I am the Teacher. Screen Sharing is Active.</div>;
// };







////////////////////////////////////////////////////////////////////////////////////////////////////

import React, { useEffect } from 'react';

export const TeacherScreenShare = () => {
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
            console.log("Teacher connected to WebSocket server");
            startScreenShare(ws);
        };

        const startScreenShare = async (ws) => {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const track = stream.getTracks()[0];

                // Set up basic rtpParameters
                const rtpParameters = {
                    codecs: [
                        {
                            mimeType: 'video/VP8',  // Replace as needed, matching server setup
                            clockRate: 90000,
                            parameters: {}
                        }
                    ],
                    encodings: [{ ssrc: 12345678 }] // Example; replace with unique SSRC
                };

                // Send 'startScreenShare' event with correct rtpParameters
                ws.send(JSON.stringify({
                    type: 'startScreenShare',
                    peerId: 'teacher',
                    rtpParameters,
                    kind: 'video'
                }));

                // Handle screen sharing stopping when track ends
                track.onended = () => {
                    ws.send(JSON.stringify({ type: 'stopScreenShare', peerId: 'teacher' }));
                };
            } catch (error) {
                console.error('Screen Share Error:', error);
            }
        };

        return () => ws.close(); // Clean up WebSocket on component unmount
    }, []);

    return <div>Hi, I am the Teacher. Screen Sharing is Active.</div>;
};
