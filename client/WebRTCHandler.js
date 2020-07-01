var WebRTCHandler = function(){
    this.user = null;
    this.iceServers = {
        'iceServers': [
            {'urls': 'stun:stun.stunprotocol.org:3478'},
            {'urls': 'stun:stun.l.google.com:19302'},
        ]
    };
    this.peerConnection = null;
    this.localMediaElement = null;
    this.localMediaStream = null;
    this.remoteMediaElement = null;
    this.remoteMediaStream = null;
    this.signallingServerConnection = null;
    var self = this;
    this.adduser = function(userId){
        self.user = userId;
    }

    this.addlLocalElement = function(elementId){
        self.localMediaElement = document.getElementById(elementId);
    }

    this.addlLocalStream = function(localStream){
        self.localMediaStream = localStream;
    }

    this.showLocalStream = function(){
        self.localMediaElement.srcObject = self.localMediaStream;
    }

    this.initRTCCall = function(){
        self.peerConnection = new RTCPeerConnection(this.iceServers);
        self.peerConnection.onicecandidate = self.gotIceCandidate;
        self.peerConnection.ontrack = self.gotRemoteStream;
        if(this.localStream){
            self.peerConnection.addStream(self.localStream);
        }
    }

    this.createOffer = function(){
        self.peerConnection.createOffer().then(self.createdDescription).catch(self.errorHandler);
    }

    this.gotIceCandidate = function(event) {
        if(event.candidate != null) {
          self.signallingServerConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': self.user}));
        }
    }

    this.gotRemoteStream = function(event) {
        console.debug('got remote stream');
        self.remoteMediaElement.srcObject = event.streams[0];
    }

    this.initSignallingServer = function(signallingUrl, signallingServerType){
        switch(signallingServerType){
            case 'socket':
                self.signallingServerConnection = '';
                break;
            case 'wss':
            default:
                self.signallingServerConnection = new WebSocket(signallingUrl);
                // self.signallingServerConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
                self.signallingServerConnection.onmessage = self.gotMessageFromServer;
                break;
        }
    }

    this.gotMessageFromServer = function(message){
        if(!self.peerConnection) start(false);
        var signal = JSON.parse(message.data);
        // Ignore messages from ourself
        if(signal.uuid == self.user) return;
        if(signal.sdp) {
            self.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
            // Only create answers in response to offers
            if(signal.sdp.type == 'offer') {
                self.peerConnection.createAnswer().then(self.createdDescription).catch(self.errorHandler);
            }
            }).catch(errorHandler);
        } else if(signal.ice) {
            self.peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(self.errorHandler);
        }
    }

    this.createdDescription = function(description){
        console.debug('got description');
        self.peerConnection.setLocalDescription(description).then(function() {
            self.signallingServerConnection.send(
                JSON.stringify({'sdp': self.peerConnection.localDescription, 'uuid': self.user})
            );
        }).catch(errorHandler);
    }

    this.errorHandler = function(error){
        console.error(error);
    }

    this.createUUID = function() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }  
        self.user =  s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    this.endCall = function(){
        self.peerConnection.close();
        slef.peerConnection = null;
    }
};