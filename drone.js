/*---------------------------------*/
/* This module controlls the drone */
/*---------------------------------*/

// Driver module needed to access motors, sensors
const driver = require('./build/Release/driver.node')

// Logger: writes useful data to the console
const logger = require('./logger')

// Switches whether logging is enabled or not
const LOGGING = true;

// Switches whether servos are ought to be signaled
const SIGNAL_MOTORS = true;

// Needed to convert RAD to DEG
const RAD_TO_DEG = 180 / Math.PI;

// Colors indicating the state of drone
const SETUP_COLOR = 'Magenta';
const DISARMED_COLOR = 'White';
const ARMED_COLOR = 'Green';

// Determines the value of declination on joystick endpoint
const ENDPOINT_ANGLE = -15

// Shows whether GPS is available on the drone
var gps_available;

// Stores every raw & calculated data
var data = {
    'armed': false,
    'input': {
        'throttle': 0,
        'pitch': 0,
        'jaw': 0,
        'roll': 0
    },
    'gps': {
        'longitude': null,
        'latitude': null,
        'height': null,
        'horizAcc': null,
        'vertAcc': null
    },
    'mpu': {
        'AccX': 0,
        'AccY': 0,
        'AccZ': 0,
        'GyrX': 0,
        'GyrY': 0,
        'GyrZ': 0,
        'MagX': 0,
        'MagY': 0,
        'MagZ': 0
    },
    'currentAccel': {
        'pitch': 0,
        'roll': 0,
        'jaw': 0
    },
    'currentGyro': {
        'pitch': 0,
        'roll': 0,
        'jaw': 0
    },
    'orientation': {
        'pitch': 0,
        'roll': 0,
        'jaw': 0
    },
    'error': {
        'pitch': 0,
        'roll': 0,
        'jaw': 0
    }
};

// Stores default rates after calibration
var gyrRates = {
    'X': 0,
    'Y': 0,
    'Z': 0
}

// Controller data needs to be outside the loop because of integral
var pi_controller = {
    'roll': {
        'proportional': 0,
        'integral': 0
    },
    'pitch': {
        'proportional': 0,
        'integral': 0
    },
}

// Launches the drone
async function arm() {
    if (!data['armed']) {
        data['armed'] = true;
        driver.setLED(ARMED_COLOR);
        logger.armed();
        loop();
    }
}

// Stops the drone
function disArm() { 
    if (data['armed']) {
        data['armed'] = false;
        keepESCsAlive() 
        driver.setLED(DISARMED_COLOR);
        logger.disArmed();
    }
}

// Called once, initializes the drone
async function start() {
    // Check if server is run by root
    if (process.getuid() != 0) {
        logger.sendError('Operation permitted. Try: sudo node app.js')
        process.exit(1);
    }
    // Check if APM is running
    let APM = await driver.checkAPM();
    if (APM) {
        logger.sendError('APM is running, please turn it off.')
        process.exit(1);
    }
    // Initialize LED
    await driver.initLED();
    // Set LED to magenta
    await driver.setLED(SETUP_COLOR);
    // Initialize ESC
    if (SIGNAL_MOTORS)
        await initESCs();
    // Setting up MPU sensors
    await driver.setupMPU();
    // Checking whether GPS is available
    gps_available = await driver.setupGPS();
    // Calibrating sensors
    await calibrateSensors();
    // Setup is done, set LED to white
    driver.setLED(DISARMED_COLOR);
}

// Main part, controlls the drone while it is armed
async function loop() {
    let last = Date.now();
    while (data['armed']) {
        
        // Delta time
        let now = Date.now();
        let deltaTime = (last - now) / 1000; // Time since last MPU read in seconds
        last = Date.now(); // Set last MPU read to now
        
        /*-----------------*/
        /* Reading sensors */
        /*-----------------*/

        // GPS
        await tryGetGPSData();

        // MPU
        await readMPU();
        let AccX = data['mpu']['AccX']
        let AccY = data['mpu']['AccY']
        let AccZ = data['mpu']['AccZ']
        let GyrX = data['mpu']['GyrX'] - gyrRates['X']
        let GyrY = data['mpu']['GyrY'] - gyrRates['Y']
        let GyrZ = data['mpu']['GyrZ'] - gyrRates['Z']
        let MagX = data['mpu']['MagX']
        let MagY = data['mpu']['MagY']
        let MagZ = data['mpu']['MagZ']

        /*-------------*/
        /* Calculation */
        /*-------------*/

        // Accelerometer
        data['currentAccel']['pitch']  = Math.atan(AccY/Math.sqrt(AccX*AccX + AccZ*AccZ)) * RAD_TO_DEG
        data['currentAccel']['roll'] = Math.atan(AccX/Math.sqrt(AccY*AccY + AccZ*AccZ)) * RAD_TO_DEG
        
        // Gyro
        data['currentGyro']['pitch'] += GyrX * deltaTime * RAD_TO_DEG
        data['currentGyro']['roll'] += GyrY * deltaTime * RAD_TO_DEG
        data['currentGyro']['jaw'] += GyrZ * deltaTime * RAD_TO_DEG

        // Complementary filter
        data['orientation']['pitch'] = process.env.GYROSCOPE_WEIGHT * (data['orientation']['pitch'] + GyrX * deltaTime * RAD_TO_DEG) + process.env.ACCELEROMETER_WEIGHT * data['currentAccel']['pitch']
        data['orientation']['roll'] = process.env.GYROSCOPE_WEIGHT * (data['orientation']['roll'] + GyrY * deltaTime * RAD_TO_DEG) + process.env.ACCELEROMETER_WEIGHT * data['currentAccel']['roll']
        
        /*-------------------*/
        /* The PI Controller */
        /*-------------------*/

        // Determines desired angle of the drone
        let desired = {
            'pitch': data['input']['pitch'] * ENDPOINT_ANGLE * 2,
            'roll': data['input']['roll'] * ENDPOINT_ANGLE * 2
        }
        
        // Determines angle distance between desired and current (error = desired - current)
        data['error']['pitch'] = desired['pitch'] - data['orientation']['pitch']
        data['error']['roll'] = desired['roll'] - data['orientation']['roll']

        // Proportional
        pi_controller['pitch']['proportional'] = process.env.PITCH_P * data['error']['pitch']
        pi_controller['roll']['proportional'] = process.env.ROLL_P * data['error']['roll']

        // Integral
        pi_controller['pitch']['integral'] += process.env.PITCH_I * data['error']['pitch'] * deltaTime
        pi_controller['roll']['integral'] += process.env.ROLL_I * data['error']['roll'] * deltaTime

        // Maximize integral
        if(process.env.PITCH_MAX_I < pi_controller['pitch']['integral'])
            pi_controller['pitch']['integral'] = process.env.PITCH_MAX_I 
        if(process.env.ROLL_MAX_I < pi_controller['roll']['integral'])
            pi_controller['roll']['integral'] = process.env.ROLL_MAX_I
            
        // Outputs calculated from PID values
        let outputs = {
            'rollAdjust': pi_controller['roll']['proportional'] + pi_controller['roll']['integral'],
            'pitchAdjust': pi_controller['pitch']['proportional'] + pi_controller['pitch']['integral']
        }

        // Motor outputs NOTE: JAW IS NOT SUPPORTED YET!!!
        let motors = {
            'frontRight': floatToPWM(data['input']['throttle'] - degToFloat(outputs['rollAdjust']) - degToFloat(outputs['pitchAdjust'])),
            'rearLeft': floatToPWM(data['input']['throttle'] + degToFloat(outputs['rollAdjust']) + degToFloat(outputs['pitchAdjust'])),
            'rearRight': floatToPWM(data['input']['throttle'] - degToFloat(outputs['rollAdjust']) + degToFloat(outputs['pitchAdjust'])),
            'frontLeft': floatToPWM(data['input']['throttle'] + degToFloat(outputs['rollAdjust']) - degToFloat(outputs['pitchAdjust']))
        }

        // Debugging
        //console.log(motors)

        // Signal motors
        if (SIGNAL_MOTORS) {
            driver.setServoSpeed(
                motors['frontRight'],
                motors['rearLeft'],
                motors['rearRight'],
                motors['frontLeft']
            )
        }

        // Log data to console
        if (LOGGING)
            logger.logData(data, gps_available)

        // Sleep to spare CPU
        await sleep(process.env.TIMESTAMP);
    }
}

// Converts A degree -> F float.
// -1 <= F <= 1
// minAngle <= A <= maxAngle
// This float is later used to determine motor speed.
function degToFloat(A) {
    const minAngle = -90
    const maxAngle = 90
    let difference = A - minAngle
    let maxDifference = maxAngle - minAngle
    let F = (difference / maxDifference) * 2 - 1
    return -F
}

// Converts F float -> P pwm
// MIN_SERVO_RATE <= P <= MAX_SERVO_RATE 0 <= F <= 1
// This pwm signal is used to set servo speed.
// If cap != MAX_SERVO_RATE, then -1 <= P <= cap, but the mapping is the same
function floatToPWM(F) {
    let capped_float = minMax(F, 0, 1); // Just in case...
    // Mapping F(0, 1) to P(minMotorRate, MAX_SERVO_RATE) 
    var minServoRate = process.env.MIN_SERVO_RATE
    let rateDiff = process.env.MAX_SERVO_RATE - minServoRate;
    let P = rateDiff * capped_float + minServoRate;
    return minMax(P, minServoRate, process.env.SERVO_CAP);
}

// Sends signal to drone: basically sets the input values to the incoming signal
function sendSignal(direction, value) {
    data['input'][direction] = parseFloat(value);
}

// Sleeps thread
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Reading raw MPU data
async function readMPU() {
    // Getting string: [roll,pitch]
    let values = await driver.readMPU()
    // Removing []
    values = values.substring(1, values.length - 1)
    // Removing ,
    let arr = values.split(',')
    // Save read value
    data['mpu'] = {
        'AccX': parseFloat(arr[0]),
        'AccY': parseFloat(arr[1]),
        'AccZ': parseFloat(arr[2]),
        'GyrX': parseFloat(arr[3]),
        'GyrY': parseFloat(arr[4]),
        'GyrZ': parseFloat(arr[5]),
        'MagX': parseFloat(arr[6]),
        'MagY': parseFloat(arr[7]),
        'MagZ': parseFloat(arr[8])
    }
}

// Script for initializing ESCs
async function initESCs() {
    logger.sendESC('Initializing ESCs...');
    await driver.setupDrone();
    setAllServos(0)
    await sleep(1000);
    setAllServos(1024)
    await sleep(1000);
    logger.sendESC('ESCs armed!');
    keepESCsAlive();
}

// Thread for keeping ESCs armed
// It is needed to called when the drone is disarmed
// It shuts the ESCs up
async function keepESCsAlive() {
    while (!data['armed']) {
        setAllServos(1024)
        await sleep(1000);
    }
}

// Reading GPS data
async function tryGetGPSData() {
    // Getting string: [longitude,latitude,height,horizAcc,vertAcc]
    let values = await driver.readGPS()
    // Check whether the message is trash
    if (100 < values.length) return null;
    // Removing []
    values = values.substring(1, values.length - 1)
    // Removing ,
    let arr = values.split(',')
    // Saving array elements to variables
    let longitude = parseFloat(arr[0]);
    let latitude = parseFloat(arr[1]);
    let height = parseFloat(arr[2]);
    let horizAcc = parseFloat(arr[3]);
    let vertAcc = parseFloat(arr[4]);
    // Change last gps data to latest if it's not 0
    data['gps'] = {
        'longitude': longitude != 0 ? longitude : data['gps']['longitude'],
        'latitude': latitude != 0 ? latitude : data['gps']['latitude'],
        'height': height != 0 ? height : data['gps']['height'],
        'horizAcc': horizAcc != 0 ? horizAcc : data['gps']['horizAcc'],
        'vertAcc': vertAcc != 0 ? vertAcc : data['gps']['vertAcc']
    }
}

// Script for calibrating the sensors
async function calibrateSensors() {
    logger.sendIMU('Calibraing sensors, DON\'T MOVE THE DRONE!')
    var gyrSamples = {
        'X': [],
        'Y': [],
        'Z': []
    }
    for (let i = 0; i < process.env.CALIBRATION_SAMPLES; i++) {
        await readMPU();
        let GyrX = data['mpu']['GyrX']
        let GyrY = data['mpu']['GyrY']
        let GyrZ = data['mpu']['Gyrz']
        gyrSamples['X'].push(GyrX)
        gyrSamples['Y'].push(GyrY)
        gyrSamples['Z'].push(GyrZ)
        await sleep(process.env.CALIBRATION_DELAY)
    }
    gyrRates['X'] = average(gyrSamples['X'])
    gyrRates['Y'] = average(gyrSamples['Y'])
    gyrRates['Z'] = average(gyrSamples['Z'])
    logger.sendIMU('Calibration DONE')
}

// Calculates average of an array
const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length;

// Script for landing
function land() {
    data['input']['throttle'] = 0;
    disArm();
    // TODO: Perfect landing
}

// Used to keep motor values between good values
function minMax(value, min, max) {
    if (max < value)
        return max
    else if (value < min)
        return min
    else
        return value
}

// Makes it easier to handle all motors at once
function setAllServos(value) {
    driver.setServoSpeed(
        value,
        value,
        value,
        value
    )
}

function getData() {
    return data;
}

function isArmed() {
    return data['armed'];
}

// Exports
module.exports = {
    start,
    sendSignal,
    land,
    isArmed,
    getData,
    arm,
    disArm
};
