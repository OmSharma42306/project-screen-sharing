import React, { useEffect, useRef } from "react";
import { Device } from 'mediasoup-client';

const setupDeviceAndJoin = async (ws, deviceRef) => {
    try {
        const device = new Device();
        const response = await fetch('http://localhost:4000/rtpCapabilities');
        const routerRtpCapabilities = await response.json();
        //console.log('Fetched routerRtpCapabilities:', routerRtpCapabilities);

        await device.load({ routerRtpCapabilities });
        deviceRef.current = device;

        const rtpCapabilities = device.rtpCapabilities;
        //console.log("student rtcCapabilites",rtpCapabilities)
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
    const messageQueue = useRef([]); 

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:4000');

        ws.onopen = () => {
            setupDeviceAndJoin(ws, deviceRef);
            console.log("Student connected to WebSocket server");
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            console.log("Student received message of type:", data.type, data);
            if (!deviceRef.current) {
                messageQueue.current.push(data);
                return;
            }

            await handleScreenShareMessage(data);
        };

        const handleScreenShareMessage = async (data) => {
            if (data.type === 'newScreenShare') {
                const { producerId, kind, rtpParameters: rtpParametersJson } = data;
                const rtpParameters = rtpParametersJson ? JSON.parse(rtpParametersJson) : undefined;
                // console.log("id", data.peerId);
                // console.log(`Producer id: ${producerId}, kind: ${kind}, rtpParameters: ${JSON.stringify(rtpParameters, null, 2)}`);
                // console.log("Transport ID ",producerId)
                if (deviceRef.current && kind === 'video') {
                    console.log("hi")
                    try {
                        const transport = await deviceRef.current.createRecvTransport({
                            id: data.peerId,
                            iceParameters: data.iceParameters,
                            iceCandidates: data.iceCandidates,
                            dtlsParameters: data.dtlsParameters,
                        });
                        console.log("Om sharma student transport",transport)

                        transport.on('connect', ({ dtlsParameters }, callback, errback) => {
                            console.log("i am in transport on")
                            ws.send(JSON.stringify({
                                type: 'connectTransport',
                                producerId,
                                dtlsParameters
                            }));

                            ws.onmessage = (event) => {
                                const response = JSON.parse(event.data);
                                if (response.type === 'connectTransportSuccess') {
                                    console.log("Transport connected successfully!");
                                    callback();
                                } else if (response.type === 'connectTransportError') {
                                    console.error("Failed to connect transport");
                                    errback(new Error('Failed to connect transport on server'));
                                }
                            };
                        });
                        const consumer = await transport.consume({
                            id: data.peerId,
                            producerId,
                            kind,
                            rtpParameters
                        });
                        console.log("i am at consumer")
                        console.log("Adding track to MediaStream", consumer);
                        const stream = new MediaStream();
                        if(consumer.track){
                            stream.addTrack(consumer.track);
                        videoRef.current.srcObject = stream;
                        }else{
                            console.error("consumer track is missing")
                        }
                        
                    } catch (err) {
                        console.error('Error Consuming Screen Share:', err);
                    }
                }
            }
        };

        const processQueuedMessages = () => {
            while (messageQueue.current.length > 0) {
                const message = messageQueue.current.shift();
                handleScreenShareMessage(message);
            }
        };

        const interval = setInterval(() => {
            if (deviceRef.current) {
                processQueuedMessages();
                clearInterval(interval);  // Stop the interval once the device is ready
            }
        }, 100);  // Check every 100ms until device is ready

        return () => ws.close();
    }, []);

    return (
        <div>
            <h2>Student View</h2>
            <video ref={videoRef} autoPlay controls />
        </div>
    );
};
