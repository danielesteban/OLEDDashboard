const fs = require('fs');
const path = require('path');
const gifyParse = require('gify-parse');
const getPixels = require('get-pixels');

class GifPlayer {
  constructor({
    directory,
    image,
    duration = 5,
    threshold = 0.1,
  }) {
    if (!directory && !image) throw new Error('You must provide a directory or image');
    this.duration = duration;
    this.images = [];
    if (image) this.images.push(image);
    if (directory) {
      this.updateImages(directory);
      this.watchDirectory(directory);
    }
    this.setImage(0);
    this.setThreshold(threshold);
  }
  setImage(image) {
    delete this.pixels;
    const { images } = this;
    const file = fs.readFileSync(images[image]);
    this.info = gifyParse.getInfo(file);
    if (!this.info.valid || this.info.width > 0xFF || this.info.height > 0xFF) {
      this.setImage((image + 1) % images.length);
      return;
    }
    getPixels(file, 'image/gif', (err, pixels) => {
      if (err) {
        this.setImage((image + 1) % images.length);
        return;
      }
      this.pixels = pixels;
    });
    this.buffer = Buffer.alloc(2 + this.info.width * Math.ceil(this.info.height / 8));
    this.buffer[0] = this.info.width;
    this.buffer[1] = this.info.height;
    this.time = 0;
    this.frame = 0;
    this.image = image;
  }
  setThreshold(threshold) {
    this.threshold = threshold;
  }
  getFrame() {
    const {
      buffer,
      duration,
      frame,
      info,
      pixels,
      threshold,
    } = this;
    if (pixels) {
      const stride = pixels.stride[0];
      const offset = stride * frame;
      const width = pixels.shape[1];
      const height = pixels.shape[2];
      const rasterheight = Math.ceil(height / 8);
      for (let i = 0; i < stride; i += 4) {
        const gray = (
          ((pixels.data[offset + i] / 255) * 0.299) +
          ((pixels.data[offset + i + 1] / 255) * 0.587) +
          ((pixels.data[offset + i + 2] / 255) * 0.114)
        ) / 3;
        const pixel = Math.floor(i / 4);
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const byteIndex = 2 + (x * rasterheight) + Math.floor(y / 8);
        const bitIndex = y % 8;
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
      this.time += info.duration / 1000;
      if (this.time >= duration) {
        this.setImage((this.image + 1) % this.images.length);
      }
    }
    return { frame: buffer, delay: info.images[frame].delay };
  }
  updateImages(directory) {
    const { images } = this;
    images.length = 0;
    fs
      .readdirSync(directory)
      .filter(file => (~(file.indexOf(".gif"))))
      .map(file => path.join(directory, file))
      .forEach(image => images.push(image));
  }
  watchDirectory(directory) {
    fs.watch(directory, () => {
      clearTimeout(this.watchTimer);
      this.watchTimer = setTimeout(() => this.updateImages(directory), 500);
    });
  }
}

module.exports = GifPlayer;
