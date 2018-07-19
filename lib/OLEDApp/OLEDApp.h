// OLEDApp
// ===============
// Simple class to create apps for the ESP-01 with:
// 1 OLED display as the output
// 2 Push buttons (with INPUT_PULLUP) as the inputs
//
// dani@gatunes © 2018

#ifndef OLEDApp_h
#define OLEDApp_h

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <SH1106Brzo.h>

class OLEDApp {
  public:
    OLEDApp(
      const uint8_t buttonPrimary,
      const uint8_t buttonSecondary,
      const uint8_t displaySDA,
      const uint8_t displaySCL,
      void (*onButton)(const uint8_t)
    );
    void setup();
    void loop();
    void clearDisplay();
    void drawImage(uint8_t width, uint8_t height, const uint8_t* image);
    void print(const char* text, const uint8_t* font = ArialMT_Plain_16);
    void progress(const uint8_t percent);
    void setBrightness(uint8_t brightness);
    SH1106Brzo display;
  private:
    struct {
      uint8_t pin;
      uint8_t read;
      uint8_t state;
      uint32_t debounce;
    } buttons[2];
    void (*onButton)(const uint8_t);
    void setupNetwork();
    ESP8266WebServer* setupNetworkServer;
};

#endif // OLEDApp_h
