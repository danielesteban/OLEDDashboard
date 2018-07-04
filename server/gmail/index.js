const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const SECRET_PATH = path.resolve(__dirname, 'secret.json');
const TOKEN_PATH = path.resolve(__dirname, 'token.json');

class Gmail {
  constructor(onReady) {
    this.onReady = onReady;
    fs.stat(SECRET_PATH, (err, exists) => {
      if (!exists) return;
      fs.readFile(SECRET_PATH, (err, content) => {
        if (err) return;
        const credentials = JSON.parse(content);
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        fs.stat(TOKEN_PATH, (err, exists) => {
          if (!exists) {
            this.getNewToken(oAuth2Client);
            return;
          }
          fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return
            oAuth2Client.setCredentials(JSON.parse(token));
            this.onAuth(oAuth2Client);
          });
        });
      });
    });
  }
  getNewToken(oAuth2Client) {
    if (process.env.NODE_ENV === 'production') return;
    const authUrl = oAuth2Client.generateAuthUrl({
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
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return;
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), () => {});
        oAuth2Client.setCredentials(token);
        this.onAuth(oAuth2Client);
      });
    });
  }
  onAuth(auth) {
    this.client = google.gmail({ version: 'v1', auth });
    this.isReady = true;
    if (this.onReady) this.onReady(this.client);
  }
};

module.exports = Gmail;
