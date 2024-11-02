import React, { useEffect } from "react";
import {io} from 'socket.io-client'

export const StudentsScreenReceiver = () => {
    const videoRef = useRef(null);
    const socket = io('http://localhost:4000');

    useEffect(()=>{
        socket.on('screen-track',track => {
            videoRef.current.srcObject= new MediaStream([track]);
            videoRef.current.play();
        })
    },[])
    return <video ref={videoRef} autoPlay controls/>
}