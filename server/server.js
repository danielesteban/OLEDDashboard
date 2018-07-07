// OLED Dashboard
// ===============
// dani@gatunes © 2018

const DEVELOPMENT = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 8080;

const fs = require('fs');
const path = require('path');
const ws = require('ws');
const compareVersions = require('compare-versions');
const Image = require('./image');

const firmwaresPath = path.resolve(__dirname, 'firmwares');

class Server {
  constructor() {
    this.cache = [];
    this.ws = new ws.Server({ port: PORT });
    this.ws.on('connection', this.onClient.bind(this));
    this.getNewestFirmware((err, firmware) => {
      if (!err && firmware) {
        this.firmware = firmware;
      }
      if (DEVELOPMENT) {
        this.watchDevFirmware();
      } else {
        this.watchFirmware();
      }
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
              fs.readFile(path.join(firmwaresPath, `${this.firmware}.bin`), (err, firmware) => {
                if (err) return;
                Server.UpdateFirmware(client, firmware);
              });
            }
          }
          break;
        case 'S': // Update stream
          client.stream = data[0];
          client.send(this.cache[client.stream], () => {});
          break;
        default:
          break;
      }
    });
    client.send(`S${String.fromCharCode(this.cache.length)}`, () => {});
  }
  push(stream, message) {
    const updateNumStreams = stream > (this.cache.length - 1);
    let payload;
    if (message instanceof Image) {
      payload = message.buffer;
    } else {
      payload = `M${message}`;
    }
    this.cache[stream] = payload;
    this.ws.clients.forEach((client) => {
      if (client.isUpdating) return;
      if (client.stream === stream) {
        client.send(payload, () => {});
      }
      if (updateNumStreams) {
        client.send(`S${String.fromCharCode(this.cache.length)}`, () => {});
      }
    });
  }
  getNewestFirmware(callback) {
    fs.readdir(firmwaresPath, (err, files) => {
      if (err) return callback(true);
      const firmwares = files
        .filter(file => ~(file.indexOf('.bin')))
        .map(file => file.substr(0, file.indexOf('.bin')));
      firmwares.sort(compareVersions);
      return callback(false, firmwares[0]);
    });
  }
  watchDevFirmware() {
    // Automatically push updates when they're compiled
    const update = path.resolve(__dirname, '../.pioenvs/esp01/firmware.bin');
    const dir = path.dirname(update);
    const file = path.basename(update);
    fs.watch(dir, (e, name) => {
      if (name !== file || !fs.existsSync(update)) {
        return;
      }
      clearTimeout(this.watchTimer);
      this.watchTimer = setTimeout(() => {
        fs.readFile(update, (err, firmware) => {
          if (err) return;
          this.ws.clients.forEach(client => Server.UpdateFirmware(client, firmware));
        });
      }, 500);
    });
  }
  watchFirmware() {
    // Automatically push the latest available firmware
    fs.watch(firmwaresPath, (e, file) => {
      if (!(~(file.indexOf('.bin')))) return;
      const version = file.substr(0, file.indexOf('.bin'));
      if (this.firmware && compareVersions(this.firmware, version) > 0) {
        return;
      }
      clearTimeout(this.watchTimer);
      this.watchTimer = setTimeout(() => {
        this.getNewestFirmware((err, firmware) => {
          if (err || !firmware) {
            delete this.firmware;
            return;
          }
          this.firmware = firmware;
          fs.readFile(path.join(firmwaresPath, `${this.firmware}.bin`), (err, firmware) => {
            if (err) return;
            this.ws.clients.forEach(client => Server.UpdateFirmware(client, firmware));
          });
        });
      }, 500);
    });
  }
  static UpdateFirmware(client, firmware) {
    if (client.isUpdating) return;
    if (DEVELOPMENT) console.log('sending firmware...');
    let sent = 0;
    const chunkSize = 1024;
    const send = (err) => {
      if (err || sent >= firmware.length) return;
      const start = sent;
      const end = Math.min(sent + chunkSize, firmware.length);
      sent += (end - start);
      client.send(firmware.slice(start, end), err => process.nextTick(() => send(err)));
    };
    client.isUpdating = true;
    client.send(`F${firmware.length}`, err => process.nextTick(() => send(err)));
  };
};

module.exports = Server;
