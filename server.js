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
		// handle.updateAllDreams(db);	// run sentiment analysis on all old dreams

		// run these manually occasionally to update the sentiment graphs on the viz page:
		// handle.updateAllTags(db);
		// handle.updateAllCharacters(db);
	},
	function() {
		util.log("DB failure");
	}
);

util.log("port : "+port);


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
				util.log('dataJSON.pass '+dataJSON.pass + '   config.accesspw ' + config.accesspw);
				util.log('dataJSON.startDate '+dataJSON.startDate);
				if(dataJSON.pass == config.accesspw) {
					switch(dataJSON.req) {
						case 'all' : 	handle.all(db,dataJSON.tag,dataJSON.character,dataJSON.sort,dataJSON.cflags,dataJSON.startDate,dataJSON.endDate,response);
										break;
						case 'viz' : 	handle.viz(db,response);
										break;
						case 'viz_tags' : 	handle.viz_tags(db,response);
										break;		
						case 'viz_chars' : 	handle.viz_chars(db,response);
										break;				
						case 'chars' : 	handle.getChars(db,response);
										break;
						case 'tags' : 	handle.getTags(db,response);
										break;
						case 'delete' : handle.deleteDream(db,dataJSON.id,response);
						 				break;
						case 'one' :	handle.getDream(db,dataJSON.id,response);
										break;
						case 'save' : 	handle.saveDream(db,dataJSON.data,response);
										break;
						case 'checkpw': response.end('1');
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

		}).resume();



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
				case '/tags':
					file.serveFile('/tags.html', 500, {}, request, response);
					break;
				case '/all':
					file.serveFile('/all.html', 500, {}, request, response);
					break;
				case '/viz':
					file.serveFile('/viz.html', 500, {}, request, response);
					break;
				default :
					file.serve(request, response, function(err) { 
						if (err && (err.status === 404)) { 
						util.log('not found: ' + request.url);
						file.serveFile('/404.html', 404, {}, request, response);
						}
					});
			}
		}).resume();

	}

});


server.listen(port);
util.log("Server listening on port "+port);

