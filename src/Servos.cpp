#include <unistd.h>
#include "Navio/Navio2/PWM.h"
#include "Navio/Navio+/RCOutput_Navio.h"
#include "Navio/Navio2/RCOutput_Navio2.h"
#include "Navio/Common/Util.h"
#include <unistd.h>
#include <memory>
#include "Servos.h"

#define SERVO_MIN 100 /*mS*/
#define SERVO_MAX 1500 /*mS*/

#define FRONT_RIGHT 0
#define REAR_LEFT 1
#define FRONT_LEFT 2
#define REAR_RIGHT 3

using namespace Navio;

// Get pwm manager
auto pwm = std::unique_ptr <RCOutput>{ new RCOutput_Navio2() };

//int main(int argc, char *argv[])
int setup()
{   
    // Check whether APM is running
    if (check_apm()) {
        return 1;
    }

    // Check if user is root
    // if (getuid()) {
    //     fprintf(stderr, "Not root. Please launch like this: sudo %s\n", argv[0]);
    // }

    // Initialize motors
    if (
        !(pwm->initialize(FRONT_RIGHT)) ||
        !(pwm->initialize(REAR_LEFT)) ||
        !(pwm->initialize(FRONT_LEFT)) ||
        !(pwm->initialize(REAR_RIGHT))
    ) {
        return -1;
    }
        
	pwm->set_frequency(FRONT_RIGHT, 50);
    pwm->set_frequency(REAR_LEFT, 50);
    pwm->set_frequency(FRONT_LEFT, 50);
    pwm->set_frequency(REAR_RIGHT, 50);

	if (
        !(pwm->enable(FRONT_RIGHT)) ||
        !(pwm->enable(REAR_LEFT)) ||
        !(pwm->enable(FRONT_LEFT)) ||
        !(pwm->enable(REAR_RIGHT))
    ) {
        return -1;
    }
    /*while (true) {
        pwm->set_duty_cycle(FRONT_RIGHT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(FRONT_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_RIGHT, SERVO_MIN);
        sleep(1);
    }*/
    

    /*while (true) {
        pwm->set_duty_cycle(FRONT_RIGHT, SERVO_MAX);
        pwm->set_duty_cycle(REAR_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(FRONT_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_RIGHT, SERVO_MIN);
        sleep(1);
        pwm->set_duty_cycle(FRONT_RIGHT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_LEFT, SERVO_MAX);
        pwm->set_duty_cycle(FRONT_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_RIGHT, SERVO_MIN);
        sleep(1);
        pwm->set_duty_cycle(FRONT_RIGHT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(FRONT_LEFT, SERVO_MAX);
        pwm->set_duty_cycle(REAR_RIGHT, SERVO_MIN);
        sleep(1);
        pwm->set_duty_cycle(FRONT_RIGHT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(FRONT_LEFT, SERVO_MIN);
        pwm->set_duty_cycle(REAR_RIGHT, SERVO_MAX);
        sleep(1);
    }*/

    return 0;
}
void setServoSpeed(int frontRight, int rearLeft, int frontLeft, int rearRight) {
    pwm->set_duty_cycle(FRONT_RIGHT, frontRight);
    pwm->set_duty_cycle(REAR_LEFT, rearLeft);
    pwm->set_duty_cycle(FRONT_LEFT, frontLeft);
    pwm->set_duty_cycle(REAR_RIGHT, rearRight);
}