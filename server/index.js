// OLED Dashboard
// ===============
// dani@gatunes © 2018

const request = require('request');
const Google = require('./google');
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

// Noisy frames
// Stream ID: 2
{
  const stream = 2;
  const frame = Buffer.alloc(2 + (128 * 64 / 8));
  frame[0] = 128;
  frame[1] = 64;
  const update = () => {
    for (let i = 2; i < frame.length; i += 1) {
      frame[i] = Math.floor(Math.random() * 256);
    }
    server.push(stream, frame);
    setTimeout(update, 60);
  };
  update();
}

Google.auth((auth) => {
  // New emails
  // Stream ID: 3
  {
    const stream = 3;
    const client = Google.gmail(auth);
    const update = () => {
      client.users.messages.list({
        userId: 'me',
        q: 'in:inbox category:primary label:unread newer_than:7d',
      }, (err, res) => {
        if (err) return;
        const newEmails = res.data.resultSizeEstimate;
        server.push(stream, (
          `${newEmails > 0 ? newEmails : 'No'} Email${newEmails == 1 ? '' : 's'}`
        ));
        setTimeout(update, 30000);
      });
    };
    update();
  }

  // Web hits
  // Stream ID: 4
  {
    const stream = 4;
    const client = Google.analytics(auth);
    const update = () => {
      client.reports.batchGet({
        requestBody: {
          reportRequests: [{
            viewId: '168848745',
            dateRanges: [
              {
                startDate: '7DaysAgo',
                endDate: 'Today'
              }
            ],
            metrics: [
              {
                expression: 'ga:users'
              }
            ],
          }],
        },
      }, (err, res) => {
        if (err) return;
        const reports = res.data.reports;
        if (reports.length) {
          const webHits = reports[0].data.rows[0].metrics[0].values[0];
          server.push(stream, (
            `${webHits > 0 ? webHits : 'No'} Hit${webHits == 1 ? '' : 's'}`
          ));
          setTimeout(update, 30000);
        }
      });
    };
    update();
  }
});
