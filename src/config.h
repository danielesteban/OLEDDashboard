// OLED Dashboard
// ===============
// dani@gatunes © 2018

#ifndef config_h
#define config_h

// Server config
struct {
  const char* server;
  const uint16_t port;
  const char* path;
  const char* thumbprint;
  const bool tls;
  const char* version;
} config = {
  "SERVER_HOST", 443, "/",
  "TLS_CERT_THUMBPRINT", true,
  FIRMWARE_VERSION
};

// I/O config
#define DISPLAY_SDA 0
#define DISPLAY_SCL 2
#define PRIMARY_BUTTON 1
#define SECONDARY_BUTTON 3

// Auto-pagination
#define AUTOPAGINATION 5000

// Brightness
#define BRIGHTNESS 127

#endif // config_h
