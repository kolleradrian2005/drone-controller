#include "APMCheck.h"
#include <stdlib.h>

bool check_APM()
{
    int ret =  system("ps -AT | grep -c ap-timer > /dev/null");
    return WEXITSTATUS(ret) <= 0;
}