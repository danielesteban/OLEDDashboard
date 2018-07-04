OLED Dashboard
==============

Edit [src/config.h](src/config.h):
```c++
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

##### The first time, you'll need to upload the sketch over serial (using a Raspberry PI UART or a USB2TTL dongle):
`platformio run --target=upload --upload-port=SERIAL_PORT`

#### Pushing data:

```js
const server = new Server();
// This will be sent to all connected clients that have that stream selected
// The last frame is cached to be sent when clients switch to the stream
server.push(UINT8_STREAM_ID, 'Arbitrary data');
```

You can see some example streams in: [server/index.js](server/index.js).

#### Dev Server:

- cd server
- yarn install
- yarn dev

While in development, the server will watch the output directory of platformio and every time you run "platformio run" it will try to push the firmware to all connected clients.


#### Production Server:

- cd server
- docker-compose -p DashboardServer up -d --build

While in production, the latest firmware inside the '[server/firmwares](server/firmwares)' folder will be flashed to all clients with a prior version. The firmware filenames should follow the naming convention: `MAJOR.MINOR.PATCH.bin`
