const drone = require('./drone');
const websocket = require('./websocket');
const webserver = require('./webserver');
const infosocket = require('./infosocket');

// Config .env
require('dotenv').config();

// Start the drone
drone.start();

// Start websocket
websocket.start();

// Start webserver
webserver.start();

// Start infosocket
infosocket.start();
