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
  const analytics = Google.analytics(auth);
  const gmail = Google.gmail(auth);

  // New emails
  // Stream ID: 3
  {
    const stream = 3;
    const update = () => {
      gmail.users.messages.list({
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

  // Web users in last month (Count)
  // Stream ID: 4
  {
    const stream = 4;
    const request = {
      requestBody: {
        reportRequests: [{
          viewId: '168848745',
          dateRanges: [{
            startDate: '32DaysAgo',
            endDate: 'Today',
          }],
          metrics: [{
            expression: 'ga:users',
          }],
        }],
      },
    };
    const update = () => {
      analytics.reports.batchGet(request, (err, res) => {
        if (err) return;
        const reports = res.data.reports;
        if (reports.length) {
          const users = reports[0].data.rows[0].metrics[0].values[0];
          server.push(stream, (
            `${users > 0 ? users : 'No'} User${users == 1 ? '' : 's'}`
          ));
          setTimeout(update, 60000);
        }
      });
    };
    update();
  }

  // Web users in last month (Graph)
  // Stream ID: 5
  {
    const stream = 5;
    const request = {
      requestBody: {
        reportRequests: [{
          viewId: '168848745',
          dateRanges: [{
            startDate: '32DaysAgo',
            endDate: 'Today',
          }],
          metrics: [{
            expression: 'ga:users',
          }],
          dimensions: [{
            name: 'ga:date',
          }],
        }],
      },
    };
    const getDateFromToday = (offset) => {
      const now = new Date();
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset
      );
      const date = target.getDate();
      const month = target.getMonth() + 1;
      const year = target.getFullYear();
      return (
        `${year}` +
        `${month < 10 ? '0' : ''}${month}` +
        `${date < 10 ? '0' : ''}${date}`
      );
    };
    const update = () => {
      // Fetch the last 32 days user count
      analytics.reports.batchGet(request, (err, res) => {
        if (err) return;
        const reports = res.data.reports;
        if (reports.length) {
          let max = 0;
          // Reformat the data
          const hits = reports[0].data.rows
            .map(({
              dimensions: [date],
              metrics: [{ values: [users] }]
            }) => ({ date, users }))
            .reduce((map, { date, users }) => {
              map[date] = parseInt(users, 10);
              max = Math.max(max, map[date]);
              return map;
            }, {});
          max *= 1.1;
          const ratio = 64 / max;
          const frame = Buffer.alloc(2 + (128 * 64 / 8));
          frame[0] = 128;
          frame[1] = 64;
          // Graph it out
          for (let i = 0; i < 32; i += 1) {
            const date = getDateFromToday(-31 + i);
            const height = Math.floor((hits[date] || 0) * ratio);
            for (let y = 0; y < height; y += 1) {
              for (let x = (i * 4); x < ((i * 4) + 3); x += 1) {
                const byteIndex = 2 + ((63 - y) * 16) + Math.floor(x / 8);
                const bitIndex = Math.floor(x % 8);
                frame[byteIndex] |= ((1 << bitIndex) & 0xFF);
              }
            }
          }
          // Push the image to the clients
          server.push(stream, frame);
          setTimeout(update, 60000);
        }
      });
    };
    update();
  }
});
