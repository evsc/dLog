// ---------------------------------------
// Globals
// ---------------------------------------
var util = require('util');					// output console logs
var http = require('http');					// create HTTP server
var url = require('url');					// URL parsing utilities
var nodeStatic = require('node-static');	// serve static HTML files

var config = require('./config');			// db configuration data
var handle = require('./lib/handle')
	.initialize();							// handler for POST requests

var port = process.env.PORT || 8010;

var db = require('./lib/db.js').initialize(
	port,
	config.db,
	function() {
		util.log("DB success");
	},
	function() {
		util.log("DB failure");
	}
);

var zeo = require('./lib/zeo.js').initialize();


// ---------------------------------------
// Run
// ---------------------------------------

var server = http.createServer(function (request, response) {
	
	var path = url.parse(request.url, true); 		// parse the query string; 
	var params = (path.query || path.headers); 		// url.parse doesn't handle POST
	var file = new nodeStatic.Server('./public'); 	// serve up public files

	if (request.method === 'POST') {
		util.log("Server request POST");

		var data = '';
		request.addListener('data', function(chunk) {
			data += chunk;
		});

		request.addListener('end', function() {
			util.log("POST data: "+data);

			try {
				var dataJSON = JSON.parse(data);
			} catch(e) {
				util.log('Error parsing JSON data');
			}

			if(dataJSON) {
				if(dataJSON.pass == 'gogogo') {
					switch(dataJSON.req) {
						case 'all' : 	handle.all(db,dataJSON.tag,dataJSON.character,response);
										break;
						case 'delete' : handle.deleteDream(db,dataJSON.id,response);
						 				break;
						case 'one' :	handle.getDream(db,dataJSON.id,response);
										break;
						case 'save' : 	handle.saveDream(db,dataJSON.data,response);
										break;
					}
				} else {
					util.log('Wrong Password: '+dataJSON.pass);
					response.writeHead(200, {'content-type': 'text/plain' });
					response.end('Wrong Password!');
				}
			} else {

				util.log('Deadend');
				response.writeHead(200, {'content-type': 'text/plain' });
				response.end('Don\'t know what you want');

			}

		});



	} else if (request.method === 'GET') {
		util.log("Server request GET "+path.pathname);

		request.addListener('end', function() {
			switch (path.pathname) {
				case '/':
				case '/new':
				case '/one':
					var url = '/one.html';
					if(params.id) url += '?id='+params.id;
					file.serveFile(url, 500, {}, request, response);
					break;
				case '/all':
					file.serveFile('/all.html', 500, {}, request, response);
					break;
				case '/zeo' : 	
					response.writeHead(200, {'content-type': 'text/plain' });
					response.end(JSON.stringify(zeo.getData()));
					break;
				default :
					file.serve(request, response, function(err) { 
						if (err && (err.status === 404)) { 
						util.log('not found: ' + request.url);
						file.serveFile('/404.html', 404, {}, request, response);
						}
					});
			}
		});
	}

});


server.listen(port);
util.log("Server listening on port "+port);