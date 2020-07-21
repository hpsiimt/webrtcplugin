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
    this.isOfferer = false;
    var self = this;
    this.adduser = function(userId){
        self.user = userId;
    }

    this.addLocalElement = function(elementId){
        self.localMediaElement = document.getElementById(elementId);
    }

    this.addRemoteElement = function(elementId){
        self.remoteMediaElement = document.getElementById(elementId);
    }

    this.addLocalStream = function(localStream){
        self.localMediaStream = localStream;
    }

    this.showLocalStream = function(){
        self.localMediaElement.srcObject = self.localMediaStream;
    }

    this.initRTCCall = function(){
        self.peerConnection = new RTCPeerConnection(this.iceServers);
        self.peerConnection.onicecandidate = self.gotIceCandidate;
        self.peerConnection.ontrack = self.gotRemoteStream;
        // self.peerConnection.onaddstream = self.gotRemoteStream;
        self.peerConnection.oniceconnectionstatechange = self.connectionstatechange;
        if(self.localMediaStream){
            self.peerConnection.addStream(self.localMediaStream);
        }
    }

    this.createOffer = function(){
        self.isOfferer = true;
        self.peerConnection.createOffer().then(self.createdDescription).catch(self.errorHandler);
    }

    this.gotIceCandidate = function(event) {
        if(event.candidate != null) {
          self.signallingServerConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': self.user}));
        }
    }

    this.gotRemoteStream = function(event) {
        console.debug('got remote stream');
        console.log(event);
        self.remoteMediaElement.srcObject = event.streams[0];
    }

    this.initSignallingServer = function(signallingUrl, signallingServerType){
        switch(signallingServerType){
            case 'socket':
                self.signallingServerConnection = '';
                break;
            case 'wss':
            default:
                // self.signallingServerConnection = new WebSocket(signallingUrl);
                self.signallingServerConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
                self.signallingServerConnection.onmessage = self.gotMessageFromServer;
                break;
        }
    }

    this.gotMessageFromServer = function(message){
        if(!self.peerConnection){
            self.initRTCCall();
        }
        var signal = JSON.parse(message.data);
        // Ignore messages from ourself
        if(signal.uuid == self.user) return;
        if(signal.sdp) {
            self.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
                // Only create answers in response to offers
                if(signal.sdp.type == 'offer') {
                    self.peerConnection.createAnswer().then(self.createdDescription).catch(self.errorHandler);
                }
            }).catch(self.errorHandler);
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
        }).catch(self.errorHandler);
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
        if(self.peerConnection){
            self.peerConnection.close();
        }
        self.peerConnection = null;
    }

    this.connectionstatechange = function(evt){ 
        console.log(self.peerConnection.connectionState);
    }
};