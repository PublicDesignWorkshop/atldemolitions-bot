The following config files are required:

`twitter-config.js`
```js
module.exports = {
  "consumer_key": "your_consumer_key",
  "consumer_secret": "your_consumer_secret",
  "access_token": "your_access_token",
  "access_token_secret": "your_access_token_secret"
};
```

`accela-config.js`
```js
module.exports = {
  client_id: 'YOUR_ACCELA_APP_CLIENT_ID',
  client_secret: 'YOUR_ACCELA_APP_CLIENT_SECRET',
  grant_type: 'password',
  username: 'ACCELA_AGENCY_ACCOUNT_USERNAME',
  password: 'ACCELA_AGENCY_ACCOUNT_PASSWORD',
  scope: 'get_record get_records search_records',
  environment: 'PROD',
  agency_name: 'atlanta_ga'
}
```
