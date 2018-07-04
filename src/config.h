// Stream 2 OLED
// ===============
// dani@gatunes © 2018

#ifndef config_h
#define config_h

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
  "0.0.1"
};

// I/O config
#define DISPLAY_SDA 0
#define DISPLAY_SCL 2
#define PRIMARY_BUTTON 3
#define SECONDARY_BUTTON 1

// Auto-pagination
#define AUTOPAGINATION 10000

#endif // config_h
