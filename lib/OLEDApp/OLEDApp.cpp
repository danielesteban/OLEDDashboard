// OLEDApp
// ===============
// Simple class to create apps for the ESP-01 with:
// 1 OLED display as the output
// 2 Push buttons (with INPUT_PULLUP) as the inputs
//
// dani@gatunes © 2018

#include "OLEDApp.h"

OLEDApp::OLEDApp(
  const uint8_t buttonPrimary,
  const uint8_t buttonSecondary,
  const uint8_t displaySDA,
  const uint8_t displaySCL,
  void (*onButton)(const uint8_t)
)
  : display(0x3C, displaySDA, displaySCL),
  buttons{{ buttonPrimary, HIGH, HIGH, 0 }, { buttonSecondary, HIGH, HIGH, 0 }},
  onButton(onButton)
  { }

void OLEDApp::setup(const char* ssid, const char* password) {
  // Buttons
  for (int i = 0; i < 2; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  // Display
  display.init();
  display.flipScreenVertically();
  // WiFi
  print(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.setSleepMode(WIFI_NONE_SLEEP);
  WiFi.setPhyMode(WIFI_PHY_MODE_11B);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  clearDisplay();
}

void OLEDApp::loop() {
  const uint32_t now = millis();
  for (uint8_t i = 0; i < 2; i++) {
    // Update button state
    const uint8_t state = digitalRead(buttons[i].pin);
    if (buttons[i].read != state) {
      buttons[i].debounce = now;
    }
    buttons[i].read = state;
    if (buttons[i].state != state && (now - buttons[i].debounce) > 10) {
      buttons[i].state = state;
      if (state == LOW) {
        onButton(i);
      }
    }
  }
}

void OLEDApp::clearDisplay() {
  display.clear();
  display.display();
}

void OLEDApp::drawImage(uint8_t width, uint8_t height, const uint8_t* image) {
  display.clear();
  uint8_t x = 64 - (width / 2);
  uint8_t y = 32 - (height / 2);
  display.drawFastImage(x, y, width, height, image);
  display.display();
}

void OLEDApp::print(const char* text, const uint8_t* font) {
  display.setTextAlignment(TEXT_ALIGN_CENTER_BOTH);
  display.setFont(font);
  display.clear();
  display.drawString(64, 32, text);
  display.display();
}

void OLEDApp::progress(const uint8_t percent) {
  display.clear();
  display.drawProgressBar(0, 28, 120, 8, percent);
  display.display();
}
