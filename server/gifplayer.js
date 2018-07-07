const fs = require('fs');
const path = require('path');
const gifyParse = require('gify-parse');
const getPixels = require('get-pixels');
const Image = require('./image');

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
    this.setThreshold(threshold);
    this.setImage(0);
  }
  setThreshold(threshold) {
    this.threshold = threshold;
  }
  setImage(index) {
    delete this.pixels;
    const { images, threshold } = this;
    const image = Image.fromFile(images[index], threshold);
    if (!image || !image.info) {
      this.setImage((image + 1) % images.length);
      return;
    }
    this.image = index;
    this.frame = image;
    this.animation = 0;
    this.time = 0;
  }
  getFrame() {
    const {
      animation,
      duration,
      frame,
    } = this;
    if (!frame) return {};
    frame.setFrame(animation);
    const delay = frame.info.images[animation].delay;
    this.animation += 1;
    if (this.animation >= frame.info.images.length) {
      this.animation = 0;
      this.time += frame.info.duration / 1000;
      if (this.time >= duration) {
        this.setImage((this.image + 1) % this.images.length);
      }
    }
    return { frame, delay };
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
