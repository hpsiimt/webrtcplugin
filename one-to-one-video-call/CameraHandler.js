var CameraHandler = function(){
    var self = this;
    self.constraints = {
        video: true,
        audio: true,
    };
    self.localStream = null;

    self.isMediaDeviceSupported = (navigator.mediaDevices.getUserMedia) ? true : false;

    self.setConstraints = function(constraints){
        self.constraints  = constraints;
    }

    self.getMediaStream =  function(successCallback, failCallback){
        navigator.mediaDevices.getUserMedia(self.constraints).then(successCallback, failCallback);
    }

    self.setLocalStream  = function(stream){
        self.localStream = stream;
    }
}