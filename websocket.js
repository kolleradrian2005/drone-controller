/*-------------------------------------------------------------*/
/* This module controlls the websocket connection of the drone */
/*-------------------------------------------------------------*/

const WebSocket = require('ws');
const drone = require('./drone');
const logger = require('./logger')

// Setting up websocket server
const webSocketServer = new WebSocket.Server({ port: 8080 });

// Storing connected clients
const clients = new Map();

// UUID generator
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

// Set up websocket server
async function start() {
    // Handle client connection
    webSocketServer.on('connection', (client) => {
        // IP address
        let address = client._socket.address().address;
        // UUID
        const id = uuidv4();
        // Save client
        clients.set(client, id);
        logger.sendInfo("Connected: " + address + " Clients: " + (clients.size))
        // Send OK message to client
        let message = {
            "message": "Connected successfully!"
        }
        client.send(JSON.stringify(message));
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
        // Route message
        switch (msg) {
            // Ping
            case "ping":
                var response = {
                    "message": "pong"
                }
                client.send(JSON.stringify(response));
                break;
            // Move
            case "move":
                let direction = dataJSON["direction"];
                let value = dataJSON["value"];
                drone.sendSignal(direction, value)
                break;
            // Data
            case "data":
                var response = {
                    'message': 'data',
                    'data': drone.getData()
                } 
                client.send(JSON.stringify(response));
                break;
            // Arm
            case "arm":
                drone.arm();
                break;
            // Disarm
            case "disarm":
                drone.disArm();
                break;
            // Unexpected
            default:
                var response = {
                    "message": "Unexpected message!"
                }
                client.send(JSON.stringify(response));
        }
    });
}

// Handling websocket disconnections
function listenForDisconnection(client) {
    client.on("close", () => {
        // IP address
        let address = client._socket.address().address;
        // Remove client
        clients.delete(client);
        // Land if the drone is flying
        if (drone.isArmed()) {
            drone.land();
        }
        logger.sendInfo("Disconnected: " + address + " Clients: " + (clients.size))
    });
}

// Exports
module.exports = {
    start
};
