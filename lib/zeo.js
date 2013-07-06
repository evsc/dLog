// ---------------------------------------
// Zeo API 
// my key: 8BAB3D22E0171F81ED2C2837493DCED5
// ---------------------------------------

var util = require('util');
var https = require('https');					// create HTTP server
var OAuth= require('node-oauth');


exports.initialize = function() {


	// var twitter = {
 //      "version": "1.0",
 //      "consumer_key": "8BAB3D22E0171F81ED2C2837493DCED5",
 //      "consumer_secret": "Aerosmith",
 //      "arg_prefix": "oauth_",
 //      // authentication
 //      "requestToken": {
 //        "url": "https://api.myzeo.com:8443/zeows/oauth/request_token",
 //        "arg": ["consumer_key"]
 //      },
 //      "authorize": {
 //        "url": "https://api.twitter.com/oauth/authorize",
 //        "arg": [{
 //          "request_token": "oauth_token"
 //        }]
 //      },
 //      "accessToken": {
 //        "key": "request_token_secret",
 //        "url": "https://api.myzeo.com:8443/zeows/oauth/access_token",
 //        "arg": ["consumer_key", {"request_token":"oauth_token"}, "oauth_verifier"]
 //      },
 //      // api
 //      "credentials": {
 //        "key": "access_token_secret",
 //        "url": "http://api.twitter.com/1/account/verify_credentials.json",
 //        "arg": ["consumer_key", {
 //          "access_token": "oauth_token"
 //        }],
 //        "account_name": "screen_name"
 //      }
 //    };

	getData = function() {

		var zeoKEY = "8BAB3D22E0171F81ED2C2837493DCED5";
		var zeoURL = "https://api.myzeo.com:8443/zeows/api/v1/json/sleeperService/getAllDatesWithSleepData?key=" + zeoKEY;
		var username = "eva.schindling@gmail.com";
		var password = "matilda1995";

		var auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');

		var oa = new OAuth("https://api.myzeo.com/zeows/oauth/request_token",
							"https://api.myzeo.com/zeows/oauth/access_token",
							zeoKEY,
							"Aerosmith",
							"1.0",
							null,
							"PLAINTEXT");

		// authorize_path: '/zeows/oauth/confirm_access'
		
		util.log("oa.getOAuthAccessToken");
		
		oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
			if (error) util.error('error :', JSON.stringify(error));
			else {
				util.log('oauth_token :' + oauth_token)
				util.log('oauth_token_secret :' + oauth_token_secret)
				util.log('requestoken results :', results)
				util.log("Requesting access token")
				oa.getOAuthAccessToken(oauth_token, oauth_token_secret,
							function(error, oauth_access_token,
								oauth_access_token_secret, results2) {
					util.log('oauth_access_token :' + oauth_access_token)
					util.log('oauth_token_secret :' + oauth_access_token_secret)
					util.log('accesstoken results :', results2)
					util.log("Requesting access token")
					var data= "";
					oa.getProtectedResource(
						zeoURL, "GET",
						oauth_access_token, oauth_access_token_secret,
				 		function (error, data, response) {
							util.log(data);
						}
					);
				});
			}
		})

		// var options = {
		// 	host: 'api.myzeo.com',
		// 	port: 8443,
		// 	method: 'GET',
		// 	headers: {
		// 		'Authorization': 'Basic ' + new Buffer(username + ':' + password).toString('base64')
		// 	}  
		// 	path:  '/zeows/api/v1/sleeperService/getOverallAverageZQScore?key=' + zeoKEY
		// 	// path: '/zeows/api/v1/json/sleeperService/getAllDatesWithSleepData?key=' + zeoKEY
		// };

		// // https.get(options, function(res) {
		// var req = https.request(options, function(res) {
		// 	util.log("Got response: " + res.statusCode);
		// 	util.log("headers: " + JSON.stringify(res.headers));
		// 	util.log("httpVersion: " + res.httpVersion);
		// 	util.log("trailers: " + JSON.stringify(res.trailers));
		// 	// util.log("res: " + res);

		// 	var d = ''; 
		// 	res.on('data', function (chunk) {
		// 		util.log('on data: ' + chunk);
		// 		d += chunk;
		// 		return d;
		// 	});

		// 	res.on('end', function() {
		// 		util.log("end");
		// 	});

		// 	res.on('error', function(e) {
		// 		util.log("res: Got error: " + e.message);
		// 	});
		// });

		// req.end();

		// req.on('error', function(e) {
		// 	util.log("Got error: " + e.message);
		// 	return 'e: ' + JSON.stringify(e);
		// });

		// return { name: 'error' };
	}

	return {
		
		getData: 	getData
		
	}

}