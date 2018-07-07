// OLEDImage
// Simple class to load/manipulate images in the OLED library internal format
//
// ===============
// dani@gatunes © 2018

const fs = require('fs');
const getPixels = require('get-pixels');
const gifyParse = require('gify-parse');
const mime = require('mime-types');

class OLEDImage {
  constructor(width, height) {
    if (width > 0xFF || height > 0xFF) {
      throw new Error("Frame dimensions must fit into an UInt8 (<=255)")
      return;
    }
    this.width = width;
    this.height = height;
    this.rasterheight = Math.ceil(height / 8);
    this.buffer = Buffer.alloc(2 + (width * this.rasterheight));
    this.buffer[0] = width;
    this.buffer[1] = height;
  }
  clear() {
    const { buffer } = this;
    for (let i = 2; i < buffer.length; i += 1) {
      buffer[i] = 0;
    }
  }
  setPixel(x, y, on) {
    const { buffer, rasterheight } = this;
    const byteIndex = 2 + (x * rasterheight) + Math.floor(y / 8);
    const bitIndex = y % 8;
    if (on) {
      buffer[byteIndex] |= (1 << bitIndex);
    } else {
      buffer[byteIndex] &= ~(1 << bitIndex);
    }
  }
  setFrame(frame) {
    const {
      info,
      pixels,
      threshold,
      width,
      height,
    } = this;
    if (!pixels || this.frame === frame) return;
    let offset = 0;
    const stride = width * height * 4;
    if (info) {
      this.frame = frame % info.images.length;
      offset = stride * this.frame;
    }
    for (let i = 0; i < stride; i += 4) {
      const gray = (
        ((pixels.data[offset + i] / 255) * 0.299) +
        ((pixels.data[offset + i + 1] / 255) * 0.587) +
        ((pixels.data[offset + i + 2] / 255) * 0.114)
      ) / 3;
      const pixel = Math.floor(i / 4);
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      this.setPixel(x, y, gray >= threshold);
    }
  }
  static fromFile(path, threshold = 0.1) {
    const file = fs.readFileSync(path);
    let pixels;
    getPixels(file, mime.lookup(path), (err, data) => {
      if (!err) pixels = data;
    });
    if (!pixels) return false;
    let width;
    let height;
    let info;
    if (pixels.shape.length > 3) {
      info = gifyParse.getInfo(file);
      if (!info.valid) return false;
      width = info.width;
      height = info.height
    } else {
      width = pixels.shape[0];
      height = pixels.shape[1];
    }
    if (width > 0xFF || height > 0xFF) return false;
    const image = new OLEDImage(width, height);
    image.info = info;
    image.pixels = pixels;
    image.threshold = threshold;
    image.setFrame(0);
    return image;
  }
}

module.exports = OLEDImage;
