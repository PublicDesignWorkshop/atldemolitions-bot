var request = require('request').defaults({ encoding: null });
var moment = require('moment');
var Jimp = require('jimp');
var Twit = require('twit')
var accelaConfig = require('./accela-config');
var twitterConfig = require('./twitter-config');

var Bot = new Twit(twitterConfig);

// http request option to get access token from Accela API
var oauthOptions = {
  method: 'POST',
  url: 'https://apis.accela.com/oauth2/token',
  json: true,
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    'postman-token': 'ec06ed9b-fc6a-7390-994f-484e6b192319',
    'cache-control': 'no-cache'
  },
  form: accelaConfig
};

// make the request to Accela API using the options above
request(oauthOptions, function (error, response, body) {
  if (error) throw new Error(error);

  var accela_token = body.access_token;
  var yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD') + ' 00:00:00';
  var today = moment().format('YYYY-MM-DD') + ' 00:00:00';

  // http request options to make the search for demolition permits to the api
  // the search query is specified in the body
  var searchOptions = {
    method: 'POST',
    url: 'https://apis.accela.com/v4/search/records/',
    qs: { expand: 'addresses' },
    headers: {
      'postman-token': 'bae3fae3-45ad-5d31-0564-f7bd862da239',
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      authorization:  accela_token
    },
    body: {
      address: { city: 'Atlanta' },
      type: { subType: 'Demolition' },
      openedDateFrom: yesterday,
      openedDateTo: today
    },
    json: true
  };

  // make the actual search request
  request(searchOptions, function (error, response, body) {
    if (error) throw new Error(error);

    for (var i = 0; i < body.result.length; i++) {
      var record = body.result[i];
      var address = record.addresses[0].streetStart + ' ' + record.addresses[0].streetName + ' ' + 
        (record.addresses[0].streetSuffix && record.addresses[0].streetSuffix.text ? record.addresses[0].streetSuffix.text : '');
      var type = record.type.type;
      console.log(record.id)
      var status = type + ' demolition permit for ' + address;
      console.log(status);

      // don't tweet all the result at once by creating a time delay
      staggerTweet(address, status, i * 1000 * 60 * 3);
    }
  });
});

function staggerTweet(street, status, delay) {
  setTimeout(function() { createTweet(street, status) }, delay);
}


function createTweet(street, status) {
  var location = encodeURI(street + ', Atlanta, GA');
  // get a street view image from the location using Google Maps API
  request.get('https://maps.googleapis.com/maps/api/streetview?size=600x400&location=' + location, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      // load the preexisint red x image into Jimp
      Jimp.read('cross.png')
      .then(function(cross) {
        // load the streetview image into Jimp
        Jimp.read(new Buffer(body))
        .then(function(image) {
          // place the red X image on top of the street view image
          image.composite(cross, 0, 0);
          // get a buffer of the image so it can be uploaded to Twitter
          image.getBuffer(Jimp.MIME_JPEG, function(err, buffer) {
            // upload the buffer to Twitter so the file can be attached to a tweet
            Bot.post('media/upload', { media_data: new Buffer(buffer).toString('base64') }, function (err, data, response) {
              console.log('upload')
              console.log(err)
              var mediaIdStr = data.media_id_string
              var meta_params = { media_id: mediaIdStr }
            

              Bot.post('media/metadata/create', meta_params, function (err, data, response) {
                console.log(err);
                if (!err) {
                  // now we can reference the media and post a tweet (media will attach to the tweet) 
                  var params = { status: status, media_ids: [mediaIdStr] }
                  Bot.post('statuses/update', params, function (err, data, response) {
                    console.log('done');
                  });
                }
              })
            })
          })
        });
      })
    }
  });
}