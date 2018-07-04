// Stream 2 OLED
// ===============
// dani@gatunes © 2018

const DEVELOPMENT = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 8080;

const fs = require('fs');
const path = require('path');
const ws = require('ws');
const compareVersions = require('compare-versions');

const firmwaresPath = path.resolve(__dirname, 'firmwares');

class Server {
  constructor() {
    this.cache = [];
    this.ws = new ws.Server({ port: PORT });
    this.ws.on('connection', this.onClient.bind(this));
    if (DEVELOPMENT) {
      this.watchDevFirmware();
    }
    fs.readdir(firmwaresPath, (err, files) => {
      const firmwares = files
        .filter(file => ~(file.indexOf('.bin')))
        .map(file => file.substr(0, file.indexOf('.bin')));
      firmwares.sort(compareVersions);
      this.firmware = firmwares[0];
    });
  }
  onClient(client) {
    if (DEVELOPMENT) {
      console.log('client connected');
      client.on('close', () => {
        console.log('client disconnected');
      });
    }
    client.on('message', (payload) => {
      if (client.isUpdating) return;
      const method = String.fromCharCode(payload[0]);
      const data = payload.slice(1);
      switch (method) {
        case 'F': // Firmware update
          {
            const version = data.toString();
            if (this.firmware && compareVersions(this.firmware, version) > 0) {
              client.isUpdating = true;
              fs.readFile(path.join(firmwaresPath, `${this.firmware}.bin`), (err, firmware) => {
                if (err) return;
                Server.UpdateFirmware(client, firmware);
              });
            }
          }
          break;
        case 'S': // Update stream
          client.stream = data[0];
          const last = this.cache[client.stream];
          client.send(`M${last || ''}`, () => {});
          break;
        default:
          break;
      }
    });
    client.send(`S${String.fromCharCode(this.cache.length)}`, () => {});
  }
  push(stream, message) {
    const updateNumStreams = stream > (this.cache.length - 1);
    this.cache[stream] = message;
    this.ws.clients.forEach((client) => {
      if (!client.isUpdating) return;
      if (client.stream === stream) {
        client.send(`M${message}`, () => {});
      }
      if (updateNumStreams) {
        client.send(`S${String.fromCharCode(this.cache.length)}`, () => {});
      }
    });
  }
  watchDevFirmware() {
    // Automatically push updates when they're compiled
    const update = path.resolve(__dirname, '../.pioenvs/esp01/firmware.bin');
    const dir = path.dirname(update);
    const file = path.basename(update);
    fs.watch(dir, (e, name) => {
      if (e === 'rename' && name === file && fs.existsSync(update)) {
        setTimeout(() => {
          fs.readFile(update, (err, firmware) => {
            fs.unlink(update, () => {});
            if (err) return;
            this.ws.clients.forEach(client => Server.UpdateFirmware(client, firmware));
          });
        }, 500);
      }
    });
  }
  static UpdateFirmware(client, firmware) {
    if (DEVELOPMENT) console.log('sending firmware...');
    let sent = 0;
    const chunkSize = 512;
    const send = (err) => {
      if (err || sent >= firmware.length) return;
      const start = sent;
      const end = Math.min(sent + chunkSize, firmware.length);
      sent += (end - start);
      client.send(firmware.slice(start, end), send);
    };
    client.isUpdating = true;
    client.send(`F${firmware.length}`, send);
  };
};

module.exports = Server;
