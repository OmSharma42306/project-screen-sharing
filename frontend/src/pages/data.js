{
    "codecs": [
        {
            "mimeType": "video/VP8",
            "kind": "video",
            "preferredPayloadType": 100,
            "clockRate": 90000,
            "parameters": {},
            "rtcpFeedback": [
                {
                    "type": "goog-remb",
                    "parameter": ""
                },
                {
                    "type": "transport-cc",
                    "parameter": ""
                },
                {
                    "type": "ccm",
                    "parameter": "fir"
                },
                {
                    "type": "nack",
                    "parameter": ""
                },
                {
                    "type": "nack",
                    "parameter": "pli"
                }
            ]
        },
        {
            "mimeType": "video/rtx",
            "kind": "video",
            "preferredPayloadType": 101,
            "clockRate": 90000,
            "parameters": {
                "apt": 100
            },
            "rtcpFeedback": []
        },
        {
            "mimeType": "video/H264",
            "kind": "video",
            "preferredPayloadType": 102,
            "clockRate": 90000,
            "parameters": {
                "level-asymmetry-allowed": 1,
                "packetization-mode": 1,
                "profile-level-id": "42e01f"
            },
            "rtcpFeedback": [
                {
                    "type": "goog-remb",
                    "parameter": ""
                },
                {
                    "type": "transport-cc",
                    "parameter": ""
                },
                {
                    "type": "ccm",
                    "parameter": "fir"
                },
                {
                    "type": "nack",
                    "parameter": ""
                },
                {
                    "type": "nack",
                    "parameter": "pli"
                }
            ]
        },
        {
            "mimeType": "video/rtx",
            "kind": "video",
            "preferredPayloadType": 103,
            "clockRate": 90000,
            "parameters": {
                "apt": 102
            },
            "rtcpFeedback": []
        }
    ],
    "headerExtensions": [
        {
            "kind": "audio",
            "uri": "urn:ietf:params:rtp-hdrext:sdes:mid",
            "preferredId": 1,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "video",
            "uri": "urn:ietf:params:rtp-hdrext:sdes:mid",
            "preferredId": 1,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "audio",
            "uri": "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
            "preferredId": 4,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "video",
            "uri": "http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time",
            "preferredId": 4,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "video",
            "uri": "http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01",
            "preferredId": 5,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "audio",
            "uri": "urn:ietf:params:rtp-hdrext:ssrc-audio-level",
            "preferredId": 10,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "video",
            "uri": "urn:3gpp:video-orientation",
            "preferredId": 11,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "video",
            "uri": "urn:ietf:params:rtp-hdrext:toffset",
            "preferredId": 12,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        },
        {
            "kind": "video",
            "uri": "http://www.webrtc.org/experiments/rtp-hdrext/playout-delay",
            "preferredId": 14,
            "preferredEncrypt": false,
            "direction": "sendrecv"
        }
    ]
}