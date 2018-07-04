// OLED Dashboard
// ===============
// dani@gatunes © 2018

#include <OLEDApp.h>
#include <UpdatableClient.h>
#include "config.h"

// App
void onButton(uint8_t button);
OLEDApp app(PRIMARY_BUTTON, SECONDARY_BUTTON, DISPLAY_SDA, DISPLAY_SCL, onButton);

// Client
void onImage(uint8_t width, uint8_t height, const uint8_t* image);
void onMessage(const char* message);
void onUpdate(const uint8_t percent);
UpdatableClient client(onImage, onMessage, onUpdate);

// Auto-pagination
#ifdef AUTOPAGINATION
uint32_t autoPaginationTimer = 0;
#endif

void onButton(uint8_t button) {
  // Paginate between streams
  switch (button) {
    case 0:
      client.previousStream();
    break;
    case 1:
      client.nextStream();
      break;
  }
  #ifdef AUTOPAGINATION
  autoPaginationTimer = millis();
  #endif
}

void onImage(uint8_t width, uint8_t height, const uint8_t* image) {
  app.drawImage(width, height, image);
}

void onMessage(const char* message) {
  app.print(message);
}

void onUpdate(const uint8_t percent) {
  if (percent == 100) {
    app.display.displayOff();
  } else {
    app.progress(percent);
  }
}

void setup() {
  app.setup(config.ssid, config.password);
  client.setup(
    config.server, config.port, config.url, config.thumbprint, config.tls,
    config.version
  );
}

void loop() {
  app.loop();
  client.loop();
  #ifdef AUTOPAGINATION
  const uint32_t now = millis();
  if ((now - autoPaginationTimer) >= AUTOPAGINATION) {
    autoPaginationTimer = now;
    client.nextStream();
  }
  #endif
}
