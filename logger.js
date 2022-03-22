/*--------------------------------------------------*/
/* This module sends useful messages to the console */
/*--------------------------------------------------*/

// Color of error messages
const ERROR_COLOR = '\x1b[31m';
const IMU_COLOR = '\x1b[33m';
const ESC_COLOR = '\x1b[35m';
const BRIGHT = '\x1b[1m';
const ESCAPE = '\x1b[0m';
const DIM = '\x1b[2m';

// Sends ARMED to the console
async function armed() {
    const prefix = BRIGHT + '\x1b[32m';
    console.log(prefix, ' ____  ____  _      _____ ____ ')
    console.log(prefix, '/  _ \\/  __\\/ \\__/|/  __//  _ \\')
    console.log(prefix, '| / \\||  \\/|| |\\/|||  \\  | | \\|')
    console.log(prefix, '| |-|||    /| |  |||  /_ | |_/|')
    console.log(prefix, '\\_/ \\|\\_/\\_\\\\_/  \\|\\____\\\\____/')
    console.log(prefix, '                               ', ESCAPE)
}

// Sends DISARMED to the console
async function disArmed() {
    const prefix = BRIGHT +'\x1b[31m';
    console.log(prefix, ' ____  _  ____  ____  ____  _      _____ ____ ')
    console.log(prefix, '/  _ \\/ \\/ ___\\/  _ \\/  __\\/ \\__/|/  __//  _ \\')
    console.log(prefix, '| | \\|| ||    \\| / \\||  \\/|| |\\/|||  \\  | | \\|')
    console.log(prefix, '| |_/|| |\\___ || |-|||    /| |  |||  /_ | |_/|')
    console.log(prefix, '\\____/\\_/\\____/\\_/ \\|\\_/\\_\\\\_/  \\|\\____\\\\____/')
    console.log(prefix, '                                              ', ESCAPE)
}

// Logs data formatted to console
async function logData(data, gps) {
    // Input
    console.log('\x1b[33m%s\x1b[0m', 'Input: ')
    console.log('\x1b[32m', 'throttle: ' + data['input']['throttle'])
    console.log('\x1b[32m', 'pitch: ' + data['input']['pitch'])
    console.log('\x1b[32m', 'jaw: ' + data['input']['jaw'])
    console.log('\x1b[32m', 'roll: ' + data['input']['roll'])

    // Orientation
    console.log('\x1b[35m', 'pitch: ' + data['orientation']['pitch'] + '°')
    console.log('\x1b[35m', 'roll: ' + data['orientation']['roll'] + '°')
    console.log('\x1b[35m', 'jaw: ' + data['orientation']['jaw'] + '°')

    // GPS
    if (gps) {
        console.log('\x1b[33m%s\x1b[0m', 'GPS: ')
        console.log('\x1b[36m', 'longitude: ' + data['gps']['longitude'])
        console.log('\x1b[36m', 'latitude: ' + data['gps']['latitude'])
        console.log('\x1b[36m', 'height: ' + data['gps']['height'])
        console.log('\x1b[36m', 'horizAcc: ' + data['gps']['horizAcc'])
        console.log('\x1b[36m', 'vertAcc: ' + data['gps']['vertAcc'])
    } else {
        sendError('GPS: NOT AVAILABLE')
    }
}

// Sends error message to console
function sendError(msg) {
    console.log(BRIGHT, ERROR_COLOR, msg, ESCAPE)
}

// Sends message by IMU
function sendIMU(msg) {
    console.log(BRIGHT, IMU_COLOR, msg, ESCAPE)
}

// Sends message by ESC
function sendESC(msg) {
    console.log(BRIGHT, ESC_COLOR, msg, ESCAPE)
}

// Sends unimportant message
function sendInfo(msg) {
    console.log(DIM, msg, ESCAPE)
}

// Exports
module.exports = {
    armed,
    disArmed,
    logData,
    sendError,
    sendIMU,
    sendESC
};