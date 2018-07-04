// UpdatableClient
// ===============
// Simple class to receive message streams & firmware updates from a server
//
// dani@gatunes © 2018

#ifndef UpdatableClient_h
#define UpdatableClient_h

#include <Arduino.h>
#include <WebSocketsClient.h>

// Memory limits
#define MAX_MESSAGE_SIZE 64
#define QUEUE_SIZE 256

class UpdatableClient {
  public:
    UpdatableClient(void (*onMessage)(const char*), void (*onUpdate)(const uint8_t));
    void setup(
      const char* server,
      const uint16_t port,
      const bool tls,
      const char* version
    );
    void loop();
    void nextStream();
    void previousStream();
  private:
    WebSocketsClient client;
    uint8_t numStreams;
    uint8_t stream;
    void (*onMessage)(const char*);
    void (*onUpdate)(const uint8_t);
    bool hasUpdated;
    bool isUpdating;
    size_t updateLength;
    size_t updateReceived;
};

#endif // UpdatableClient_h
