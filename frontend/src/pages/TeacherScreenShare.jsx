import React, { useEffect } from 'react';
import {io} from 'socket.io-client';
export const TeacherScreenShare = () =>{
    const socket = io('http://localhost:4000');

    useEffect(()=>{
        const startScreenShare = async () => {
            try{
                const stream = await navigator.mediaDevices.getDisplayMedia({video:true});
                stream.getTracks().forEach(track => socket.emit('screen-track',track));
            }catch(error){
                console.error('Screen Share Error: ',error)
            }
        }
        startScreenShare();
    },[])
    return <div>
        Hi i am Teacher,Screen Sharing Active


    </div>
}