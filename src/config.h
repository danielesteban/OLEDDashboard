// OLED Dashboard
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
  const char* thumbprint;
  const bool tls;
  const char* version;
} config = {
  "WIFI_SSID", "WIFI_PASSWORD",
  "SERVER_HOST", 443, "/",
  "TLS_CERT_THUMBPRINT", true,
  "0.0.1"
};

// I/O config
#define DISPLAY_SDA 0
#define DISPLAY_SCL 2
#define PRIMARY_BUTTON 1
#define SECONDARY_BUTTON 3

// Auto-pagination
#define AUTOPAGINATION 20000

#endif // config_h
