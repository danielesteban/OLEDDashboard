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
    UpdatableClient(
      void (*onImage)(uint8_t, uint8_t, const uint8_t*),
      void (*onMessage)(const char*),
      void (*onUpdate)(const uint8_t)
    );
    void setup(
      const char* server,
      const uint16_t port,
      const char* path,
      const char* thumbprint,
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
    void (*onImage)(uint8_t, uint8_t, const uint8_t*);
    void (*onMessage)(const char*);
    void (*onUpdate)(const uint8_t);
    bool hasUpdated;
    bool isUpdating;
    size_t updateLength;
    size_t updateReceived;
};

#endif // UpdatableClient_h
