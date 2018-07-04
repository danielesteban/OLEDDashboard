Stream 2 OLED
=============

Edit [src/config.h](src/config.h):
```
// Network config
struct {
  const char* ssid;
  const char* password;
  const char* server;
  const uint16_t port;
  const char* url;
  const bool tls;
  const char* version;
} config = {
  "WIFI_SSID", "WIFI_PASSWORD",
  "SERVER_HOST", 443, "/", true,
  "FIRMWARE_VERSION"
};
```

The first time, upload over serial:
- platformio run --target=upload

Server:
- cd server
- yarn install
- yarn run dev

While in development, the server will watch the output directory of platformio and try to push any compiled firmware to all connected clients.

While in production, the latest firmware inside the 'server/firmwares' folder will be flashed to all clients with a prior version. The firmware filenames should follow the naming convention: "MAJOR.MINOR.PATCH.bin"
