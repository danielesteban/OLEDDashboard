// Stream 2 OLED
// ===============
// dani@gatunes © 2018

#include <OLEDApp.h>
#include <UpdatableClient.h>
#include "config.h"

// App
void onButton(uint8_t button);
OLEDApp app(PRIMARY_BUTTON, SECONDARY_BUTTON, DISPLAY_SDA, DISPLAY_SCL, onButton);

// Client
void onMessage(const char* message);
void onUpdate(const uint8_t percent);
UpdatableClient client(onMessage, onUpdate);

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

void onMessage(const char* message) {
  app.print(message);
}

void onUpdate(const uint8_t percent) {
  if (percent == 100) {
    app.display.displayOff();
  } else {
    app.display.clear();
    app.display.drawProgressBar(0, 28, 120, 8, percent);
    app.display.display();
  }
}

void setup() {
  app.setup(config.ssid, config.password);
  client.setup(config.server, config.port, config.tls, config.version);
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
