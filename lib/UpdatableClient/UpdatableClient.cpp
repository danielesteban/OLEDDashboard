// UpdatableClient
// ===============
// Simple class to receive message streams & firmware updates from a server
//
// dani@gatunes © 2018

#include "UpdatableClient.h"

UpdatableClient::UpdatableClient(
  void (*onImage)(uint8_t, uint8_t, const uint8_t*),
  void (*onMessage)(const char*),
  void (*onUpdate)(const uint8_t)
)
  : numStreams(0),
  stream(0),
  onImage(onImage),
  onMessage(onMessage),
  onUpdate(onUpdate),
  hasUpdated(false),
  isUpdating(false),
  updateLength(0),
  updateReceived(0)
  { }

void UpdatableClient::setup(
  const char* server,
  const uint16_t port,
  const char* url,
  const bool tls,
  const char* version
) {
  client.onEvent([this, version](WStype_t type, uint8_t* payload, size_t length) {
    switch(type) {
      case WStype_DISCONNECTED:
        break;
      case WStype_CONNECTED:
        {
          // Set stream
          uint8_t req[2] = {'S', stream};
          client.sendBIN(req, 2);
        }
        {
          // Request update
          String req = "F";
          req += version;
          client.sendBIN((uint8_t*) req.c_str(), req.length());
        }
        break;
      case WStype_TEXT:
        {
          const char method = payload[0];
          const char* data = (char*) (payload + 1);
          switch (method) {
            case 'F': // Firmware update
              if (Update.begin((ESP.getFreeSketchSpace() - 0x1000) & 0xFFFFF000)) {
                hasUpdated = false;
                isUpdating = true;
                updateLength = atol(data);
              }
              break;
            case 'M': // Message
              if (!isUpdating && onMessage) onMessage(data);
              break;
            case 'S': // Stream count
              numStreams = data[0];
              break;
            default:
              break;
          }
        }
        break;
      case WStype_BIN:
        if (isUpdating) {
          if (Update.hasError()) return;
          Update.write(payload, length);
          updateReceived += length;
          if (onUpdate) onUpdate(updateReceived * 100 / updateLength);
          if (updateReceived == updateLength) {
            Update.end(true);
            hasUpdated = !Update.hasError();
            isUpdating = false;
            if (hasUpdated) {
              client.disconnect();
            }
          }
        } else if (
          onImage &&
          length > 2 &&
          ((size_t) payload[0] * payload[1] / 8) == (length - 2)
        ) {
          onImage(payload[0], payload[1], payload + 2);
        }
        break;
      default:
        break;
    }
  });
  if (tls) {
    client.beginSSL(server, port, url);
  } else {
    client.begin(server, port, url);
  }
}

void UpdatableClient::loop() {
  if (hasUpdated) {
    ESP.restart();
    return;
  }
  client.loop();
}

void UpdatableClient::nextStream() {
  if (stream < numStreams - 1) stream += 1;
  else stream = 0;
  uint8_t payload[2] = {'S', stream};
  client.sendBIN(payload, 2);
}

void UpdatableClient::previousStream() {
  if (stream > 0) stream -= 1;
  else stream = numStreams - 1;
  uint8_t payload[2] = {'S', stream};
  client.sendBIN(payload, 2);
}
