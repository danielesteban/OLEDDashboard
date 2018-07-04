// Stream 2 OLED
// ===============
// dani@gatunes © 2018

const request = require('request');
const Server = require('./server');
const server = new Server();

// Here are some example streams:

// Clock
// Stream ID: 0
{
  const stream = 0;
  const update = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    server.push(stream, (
      `${hours < 10 ? '0' : ''}${hours}:` +
      `${minutes < 10 ? '0' : ''}${minutes}:` +
      `${seconds < 10 ? '0' : ''}${seconds}`
    ));
    setTimeout(update, 250);
  };
  update();
}

// Weather
// Stream ID: 1
{
  const stream = 1;
  const city = 3117735;
  const units = 'metric';
  const key = 'ddf6dee09a9ebb7ebf3553cc27278220';
  const update = () => {
    request.get({
      url: `https://api.openweathermap.org/data/2.5/weather?id=${city}&units=${units}&appid=${key}`,
      json: true,
    }, (err, response, weather) => {
      if (err || !weather) return;
      server.push(stream, (
        `${weather.main.temp}° - ${weather.main.humidity}%`
      ));
      setTimeout(update, 60000);
    });
  };
  update();
}
