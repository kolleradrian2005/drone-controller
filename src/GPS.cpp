
#include "Navio/Common/Ublox.h"
#include "Navio/Common/Util.h"
#include "GPS.h"

using namespace std;

Ublox gps;
std::vector<double> pos_data;

bool setupGPS() {
    if (check_apm()) {
        return false;
    }
    return gps.testConnection();
    /*if(gps.testConnection()) {
        //printf("GPS availability OK\n");
        try {
            if (!gps.configureSolutionRate(1000))
            {
                printf("Setting new rate: FAILED\n");
            }
        } catch (const std::exception& e) {
            printf("Setting new rate: FAILED\n");
        }
        
        return true;
    } else {
        return false;
    }*/
}

double* readGPS() {
    if (gps.decodeSingleMessage(Ublox::NAV_POSLLH, pos_data) == 1)
    {
        double longitude = pos_data[1]/10000000;
        double latitude = pos_data[2]/10000000;
        double height = pos_data[4]/1000;
        double horizAcc = pos_data[5]/1000;
        double vertAcc = pos_data[6]/1000;
        //printf("GPS Millisecond Time of Week: %.0lf s\n", pos_data[0]/1000);
        /*printf("Longitude: %f\n", longitude);
        printf("Latitude: %lf\n", latitude);
        //printf("Height above Ellipsoid: %.3lf m\n", pos_data[3]/1000);
        printf("Height above mean sea level: %.3lf m\n", height);
        printf("Horizontal Accuracy Estateimate: %.3lf m\n", horizAcc);
        printf("Vertical Accuracy Estateimate: %.3lf m\n", vertAcc);
        */
        double* values = new double[5];
        values[0] = longitude;
        values[1] = latitude;
        values[2] = height;
        values[3] = horizAcc;
        values[4] = vertAcc;
        return  values;
    }
    return new double[0];
}
/*
int main(int argc, char *argv[]){
    if(setupGPS())
    {
        while (true)
        {
            double* values = readGPS();
            usleep(200);
        }

    } else {
        printf("Ublox test not passed\nAbort program!\n");
    }
    return 0;
}
*/