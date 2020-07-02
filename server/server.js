const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// Yes, TLS is required
const serverConfig = {
  key: fs.readFileSync('fake-keys/privatekey.pem'),
  cert: fs.readFileSync('fake-keys/certificate.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
const handleRequest = function(request, response) {
  // Render the single client html file for any request the HTTP server receives
  console.log('request received: ' + request.url);

  if(request.url === '/') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('../one-broadcast-one-viewer/offer.html'));
  }else if(request.url === '/offer') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('../one-broadcast-one-viewer/offer.html'));
  }else if(request.url === '/answer') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('../one-broadcast-one-viewer/answer.html'));
  } else if(request.url === '/webrtc.js') {
    response.writeHead(200, {'Content-Type': 'application/javascript'});
    response.end(fs.readFileSync('../one-broadcast-one-viewer/webrtc.js'));
  } else if(request.url === '/WebRTCHandler.js') {
    response.writeHead(200, {'Content-Type': 'application/javascript'});
    response.end(fs.readFileSync('../one-broadcast-one-viewer/WebRTCHandler.js'));
  }else if(request.url === '/121/WebRTCHandler.js') {
    response.writeHead(200, {'Content-Type': 'application/javascript'});
    response.end(fs.readFileSync('../one-to-one-video-call/WebRTCHandler.js'));
  }else if(request.url === '/121/CameraHandler.js') {
    response.writeHead(200, {'Content-Type': 'application/javascript'});
    response.end(fs.readFileSync('../one-to-one-video-call/CameraHandler.js'));
  }else if(request.url === '/121/offer') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('../one-to-one-video-call/offer.html'));
  }else if(request.url === '/121/answer') {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.end(fs.readFileSync('../one-to-one-video-call/answer.html'));
  } else if(request.url === '/121/style.css') {
    response.writeHead(200, {'Content-Type': 'text/css'});
    response.end(fs.readFileSync('../one-to-one-video-call/style.css'));
  }
};

const httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
const wss = new WebSocketServer({server: httpsServer});

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    // Broadcast any received message to all clients
    console.log('received: %s', message);
    wss.broadcast(message);
  });
});

wss.broadcast = function(data) {
  this.clients.forEach(function(client) {
    if(client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome.\n\n\
Some important notes:\n\
  * Note the HTTPS; there is no HTTP -> HTTPS redirect.\n\
  * You\'ll also need to accept the invalid TLS certificate.\n\
  * Some browsers or OSs may not allow the webcam to be used by multiple pages at once. You may need to use two different browsers or machines.\n'
);
