//var http = require('http');
//var fs = require('fs');
const express = require('express')
const logger = require('./logger')
const app = express()
const path = require('path');
const port = 3000

var htmlPath = path.join(__dirname, 'website');

function start() {
    app.use(express.static(htmlPath));
    app.listen(port, () => {
        logger.sendInfo(`Webserver listening on port ${port}`)
    })
}

module.exports = {
    start
}