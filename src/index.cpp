#include <napi.h>
#include "Servos.h"
#include "AccelGyroMag.h"
#include "GPS.h"
#include "APMCheck.h"
#include <array>
#include <string>
#include "LEDDriver.h"

using namespace std;

Napi::Number setupDrone(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, setup());
}

void setupMPU(const Napi::CallbackInfo& info) {
    setupSensors("mpu");
}

Napi::Boolean _setupGPS(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, setupGPS());
}

Napi::String readMPU(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    double* values = readMPUValues();
    // POV: Me coding in C++:
    string values_str =
    "[" +
    to_string(values[0]) + "," +
    to_string(values[1]) + "," +
    to_string(values[2]) + "," +
    to_string(values[3]) + "," +
    to_string(values[4]) + "," +
    to_string(values[5]) + "," +
    to_string(values[6]) + "," +
    to_string(values[7]) + "," +
    to_string(values[8]) + "," +
    to_string(values[9])
    + "]";
    return Napi::String::New(env, values_str);
}

Napi::String _readRollPitch(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    double* rollPitch = readRollPitch();
    string values = "[" + to_string(rollPitch[0]) + "," + to_string(rollPitch[1]) + "]";
    return Napi::String::New(env, values);
}

Napi::String _readGPS(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    double* gps_value = readGPS();
    string values = "[" + to_string(gps_value[0]) + "," + to_string(gps_value[1]) + "," + to_string(gps_value[2]) + "," + to_string(gps_value[3]) + "," + to_string(gps_value[4]) + "]";
    return Napi::String::New(env, values);
}

Napi::Boolean _checkAPM(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Boolean::New(env, check_APM());
}

void _initLED(const Napi::CallbackInfo& info) {
    initializeLED();
}

void _setLED(const Napi::CallbackInfo& info) {
    Napi::String colorName = info[0].ToString();
    setLEDColor(colorName.Utf8Value());
}

void _setServoSpeed(const Napi::CallbackInfo& info) {
    int frontRight = (int) info[0].ToNumber();
    int rearLeft = (int) info[1].ToNumber();
    int rearRight = (int) info[2].ToNumber();
    int frontLeft = (int) info[3].ToNumber();
    setServoSpeed(frontRight, rearLeft, rearRight, frontLeft);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(
        Napi::String::New(env, "setupDrone"),
        Napi::Function::New(env, setupDrone)
    );
    exports.Set(
        Napi::String::New(env, "setupMPU"),
        Napi::Function::New(env, setupMPU)
    );
    exports.Set(
        Napi::String::New(env, "readMPU"),
        Napi::Function::New(env, readMPU)
    );
    exports.Set(
        Napi::String::New(env, "setupGPS"),
        Napi::Function::New(env, _setupGPS)
    );
    exports.Set(
        Napi::String::New(env, "readGPS"),
        Napi::Function::New(env, _readGPS)
    );
    exports.Set(
        Napi::String::New(env, "readRollPitch"),
        Napi::Function::New(env, _readRollPitch)
    );
    exports.Set(
        Napi::String::New(env, "checkAPM"),
        Napi::Function::New(env, _checkAPM)
    );
    exports.Set(
        Napi::String::New(env, "initLED"),
        Napi::Function::New(env, _initLED)
    );
    exports.Set(
        Napi::String::New(env, "setLED"),
        Napi::Function::New(env, _setLED)
    );
    exports.Set(
        Napi::String::New(env, "setServoSpeed"),
        Napi::Function::New(env, _setServoSpeed)
    );
    return exports;
}

NODE_API_MODULE(driver, Init)