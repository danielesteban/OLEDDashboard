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
  onButton(onButton),
  setupNetworkServer(NULL)
  { }

void OLEDApp::setup() {
  // Buttons
  for (int i = 0; i < 2; i++) {
    pinMode(buttons[i].pin, INPUT_PULLUP);
  }
  // Display
  display.init();
  display.flipScreenVertically();
  // Setup network config server if requested/unconfigured
  if (digitalRead(buttons[1].pin) == LOW || WiFi.getMode() != WIFI_STA) {
    setupNetwork();
    return;
  }
  // WiFi
  print(WiFi.SSID().c_str());
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  clearDisplay();
}

void OLEDApp::setupNetwork() {
  // Generate SSID
  String ssid = "OLED-";
  ssid += String(ESP.getChipId(), HEX);
  // Generate random password
  String password = "";
  for (int i = 0; i < 8; i ++) {
    password += (char) ('0' + (RANDOM_REG32 % 10));
  }
  print(password.c_str());
  // Start access point with a fixed IP address
  WiFi.persistent(false);
  WiFi.mode(WIFI_AP);
  IPAddress address(192, 168, 1, 1);
  IPAddress gateway(192, 168, 1, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(address, gateway, subnet);
  WiFi.softAP(ssid.c_str(), password.c_str());
  // Setup server
  setupNetworkServer = new ESP8266WebServer(80);
  // Form
  setupNetworkServer->on("/", HTTP_GET, [this]() {
    String response = (
      "<form action=\"/\" method=\"post\">"
      "SSID:<br />"
      "<select name=\"ssid\">"
    );
    int n = WiFi.scanNetworks();
    for (int i = 0; i < n; i ++) {
      response += "<option>" + WiFi.SSID(i) + "</option>";
    }
    response += (
      "</select><br />"
      "Password:<br />"
      "<input type=\"password\" name=\"password\" /><br />"
      "<button type=\"submit\">Submit</button>"
      "</form>"
    );
    setupNetworkServer->send(200, "text/html", response);
  });
  // Endpoint
  setupNetworkServer->on("/", HTTP_POST, [this]() {
    String ssid;
    String password;
    for (uint8_t i = 0; i < setupNetworkServer->args(); i++) {
      if (setupNetworkServer->argName(i).equals("ssid")) {
        ssid = setupNetworkServer->arg(i);
      } else if (setupNetworkServer->argName(i).equals("password")) {
        password = setupNetworkServer->arg(i);
      }
    }
    if (ssid.length() && password.length()) {
      setupNetworkServer->send(200, "text/plain", "OK. Restarting...");
      delay(500);
      WiFi.persistent(true);
      WiFi.mode(WIFI_STA);
      WiFi.setSleepMode(WIFI_NONE_SLEEP);
      WiFi.setPhyMode(WIFI_PHY_MODE_11N);
      WiFi.begin(ssid.c_str(), password.c_str());
      ESP.restart();
    } else {
      setupNetworkServer->send(200, "text/plain", "FAIL.");
    }
  });
  // Handle 404s
  setupNetworkServer->onNotFound([this]() {
    setupNetworkServer->send(404);
  });
  // Run the server until a successful config causes it to restart
  setupNetworkServer->begin();
  for (;;) setupNetworkServer->handleClient();
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

void OLEDApp::setBrightness(uint8_t brightness) {
  uint8_t contrast = brightness;
  if (brightness < 128) {
    // Magic values to get a smooth/ step-free transition
    contrast = brightness * 1.171;
  } else {
    contrast = brightness * 1.171 - 43;
  }

  uint8_t precharge = 241;
  if (brightness == 0) {
    precharge = 0;
  }
  uint8_t comdetect = brightness / 8;

  display.setContrast(contrast, precharge, comdetect);
}
