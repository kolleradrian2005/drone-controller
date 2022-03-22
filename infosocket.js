/*--------------------------------------------------------------------*/
/* This module controlls the websocket prividing info about the drone */
/*--------------------------------------------------------------------*/

const WebSocket = require('ws');
const drone = require('./drone');

// Setting up websocket server
const webSocketServer = new WebSocket.Server({ port: 8081 });

// Storing connected clients
const clients = []

// Set up websocket server
async function start() {
    // Handle client connection
    webSocketServer.on('connection', (client) => {
        // Save client
        clients.push(client);
        // Listen for messages
        listenForMessages(client)
        // Listen for disconnection
        listenForDisconnection(client)
    })
}

// Handling incoming websocket messages
function listenForMessages(client) {
    client.on('message', function message(data, _) {
        let dataJSON = JSON.parse(data.toString())
        msg = dataJSON["message"]
        if (msg == 'data') {
            client.send(JSON.stringify(drone.getData()))
        }
    });
}

// Handling websocket disconnections
function listenForDisconnection(client) {
    client.on("close", () => {
        // Remove client
        const index = clients.indexOf(client);
        if (index > -1) {
            clients.splice(index, 1); // 2nd parameter means remove one item only
        }
    });
}

// Exports
module.exports = {
    start
};
