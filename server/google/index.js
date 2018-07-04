const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/gmail.readonly'
];
const SECRET_PATH = path.resolve(__dirname, 'secret.json');
const TOKEN_PATH = path.resolve(__dirname, 'token.json');

module.exports = {
  auth: (callback) => {
    fs.readFile(SECRET_PATH, (err, content) => {
      if (err) return;
      const credentials = JSON.parse(content);
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      const onToken = (token) => {
        client.setCredentials(token);
        callback(client);
      };
      const getNewToken = () => {
        if (process.env.NODE_ENV === 'production') return;
        const authUrl = client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        rl.question('Enter the code from that page here: ', (code) => {
          rl.close();
          client.getToken(code, (err, token) => {
            if (err) return;
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), () => {});
            onToken(token);
          });
        });
      };
      fs.readFile(TOKEN_PATH, (err, token) => (
        (!err && token) ? onToken(JSON.parse(token)) : getNewToken()
      ));
    });
  },
  analytics: auth => (
    google.analyticsreporting({ version: 'v4', auth })
  ),
  gmail: auth => (
    google.gmail({ version: 'v1', auth })
  )
};
