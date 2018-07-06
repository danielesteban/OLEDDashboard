const fs = require('fs');
const gifyParse = require('gify-parse');
const getPixels = require('get-pixels');

class GifPlayer {
  constructor({
    image,
    threshold,
  }) {
    this.setImage(image);
    this.setThreshold(threshold);
  }
  setImage(image) {
    const file = fs.readFileSync(image);
    this.info = gifyParse.getInfo(file);
    if (!this.info.valid) {
      throw(new Error('Invalid gif'));
    }
    if (this.info.width > 0xFF || this.info.height > 0xFF) {
      throw(new Error('Max gif supported size is 255x255'));
    }
    getPixels(file, 'image/gif', (err, pixels) => {
      if (err) {
        throw(new Error('Couldn\'t read gif pixels'));
        return;
      }
      this.pixels = pixels;
    });
    this.frame = 0;
    this.buffer = Buffer.alloc(2 + (this.info.width * this.info.height / 8));
    this.buffer[0] = this.info.width;
    this.buffer[1] = this.info.height;
  }
  setThreshold(threshold) {
    this.threshold = threshold;
  }
  getFrame() {
    const { buffer, frame, info, pixels, threshold } = this;
    if (pixels) {
      const stride = pixels.stride[0];
      const o = stride * frame;
      for (let i = 0; i < stride; i += 4) {
        const gray = (
          ((pixels.data[o + i] / 255) * 0.299) +
          ((pixels.data[o + i + 1] / 255) * 0.587) +
          ((pixels.data[o + i + 2] / 255) * 0.114)
        ) / 3;
        const pixel = Math.floor(i / 4);
        const byteIndex = 2 + Math.floor(pixel / 8);
        const bitIndex = Math.floor(pixel % 8);
        if (gray >= threshold) {
          buffer[byteIndex] |= (1 << bitIndex);
        } else {
          buffer[byteIndex] &= ~(1 << bitIndex);
        }
      }
    }
    this.frame += 1;
    if (this.frame >= info.images.length) {
      this.frame = 0;
    }
    return { frame: buffer, delay: info.images[frame].delay };
  }
}

module.exports = GifPlayer;
