#include "Navio/Common/MPU9250.h"
#include "Navio/Navio2/LSM9DS1.h"
#include "Navio/Common/Util.h"
#include <unistd.h>
#include <string>
#include <memory>
#include <math.h>
#include <tuple>
#include "AccelGyroMag.h"

#define PI 3.14159265


std::unique_ptr <InertialSensor> get_inertial_sensor( std::string sensor_name)
{
    if (sensor_name == "mpu") {
        //printf("Selected: MPU9250\n");
        auto ptr = std::unique_ptr <InertialSensor>{ new MPU9250() };
        return ptr;
    }
    else if (sensor_name == "lsm") {
        //printf("Selected: LSM9DS1\n");
        auto ptr = std::unique_ptr <InertialSensor>{ new LSM9DS1() };
        return ptr;
    }
    else {
        return NULL;
    }
}

void print_help()
{
    printf("Possible parameters:\nSensor selection: -i [sensor name]\n");
    printf("Sensors names: mpu is MPU9250, lsm is LSM9DS1\nFor help: -h\n");
}

std::string get_sensor_name(int argc, char *argv[])
{
    if (get_navio_version() == NAVIO2) {

        if (argc < 2) {
            printf("Enter parameter\n");
            print_help();
            return std::string();
        }

        // prevent the error message
        opterr = 0;
        int parameter;

        while ((parameter = getopt(argc, argv, "i:h")) != -1) {
            switch (parameter) {
            case 'i': return optarg;
            case 'h': print_help(); return "-1";
            case '?': printf("Wrong parameter.\n");
                      print_help();
                      return std::string();
            }
        }

    } else { //sensor on NAVIO+

        return "mpu";
    }

    return std::string();
}
std::unique_ptr<InertialSensor> sensor;

double* readRollPitch() {
    float AccX, AccY, AccZ;
    float GyrX, GyrY, GyrZ;
    float MagX, MagY, MagZ;

    sensor->update();
    sensor->read_accelerometer(&AccX, &AccY, &AccZ);
    sensor->read_gyroscope(&GyrX, &GyrY, &GyrZ);
    sensor->read_magnetometer(&MagX, &MagY, &MagZ);

    double roll = 180 * atan (AccX/sqrt(AccY*AccY + AccZ*AccZ))/PI;
    double pitch = 180 * atan (AccY/sqrt(AccX*AccX + AccZ*AccZ))/PI;

    /*printf("Roll: %+3.0f° ", roll);
    printf("Pitch: %+3.0f°\n", pitch);*/

    double* values = new double[2];
    values[0] = roll;
    values[1] = pitch;
    return  values;
}

double* readMPUValues() {
    float AccX, AccY, AccZ;
    float GyrX, GyrY, GyrZ;
    float MagX, MagY, MagZ;

    sensor->update();
    sensor->read_accelerometer(&AccX, &AccY, &AccZ);
    sensor->read_gyroscope(&GyrX, &GyrY, &GyrZ);
    sensor->read_magnetometer(&MagX, &MagY, &MagZ);

    double* values = new double[9];
    values[0] = AccX;
    values[1] = AccY;
    values[2] = AccZ;
    values[3] = GyrX;
    values[4] = GyrY;
    values[5] = GyrZ;
    values[6] = MagX;
    values[7] = MagY;
    values[8] = MagZ;
    return  values;
}

int setupSensors(std::string sensor_name) {
    if (check_apm()) {
        return 1;
    }
    if (sensor_name.empty()) {
        printf("Didn't pass sensor name. Select: mpu or lsm\n");
        return EXIT_FAILURE;
    }
    sensor = get_inertial_sensor(sensor_name);
    if (!sensor) {
        printf("Wrong sensor name. Select: mpu or lsm\n");
        return EXIT_FAILURE;
    }

    if (!sensor->probe()) {
        printf("Sensor not enabled\n");
        return EXIT_FAILURE;
    }

    sensor->initialize();
    return 0;
}
//=============================================================================
/*int main(int argc, char *argv[])
{
    auto sensor_name = get_sensor_name(argc, argv);
    setupSensors(sensor_name);
    while(1) {
        readRollPitch();
        usleep(100000);
    }
    return -1;
}*/