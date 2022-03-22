#include  "Navio/Navio2/RGBled.h"
#include  "Navio/Common/Led.h"
#include "LEDDriver.h"
#include <string>

RGBled led;

void initializeLED() {
    led.initialize();
}

Colors stringToColor(std::string colorName) {
    if(colorName == "Black") return Colors::Black;
    if(colorName == "Red") return Colors::Red;
    if(colorName == "Green") return Colors::Green;
    if(colorName == "Blue") return Colors::Blue;
    if(colorName == "Cyan") return Colors::Cyan;
    if(colorName == "Magenta") return Colors::Magenta;
    if(colorName == "Yellow") return Colors::Yellow;
    if(colorName == "White") return Colors::White;
    else return Colors::Black;
}

void setLEDColor(std::string colorName) {
    led.setColor(stringToColor(colorName));
}
