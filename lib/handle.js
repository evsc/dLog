// ---------------------------------------
// Request Handlers
// ---------------------------------------

var util = require('util');


exports.initialize = function() {


	all = function(db,tag,character,response) {
		util.log("POST 'all'");

		var all = { allDreams : [] };

		var query = {};
		if(tag=="false") tag = false;
		if(character=="false") character = false;
		if(tag) query['tags.name'] = tag;
		if(character) query['characters.name'] = character;
		util.log("query: "+ JSON.stringify(query));

		db.Dream.find( query , ['dream','title','date','start','characters','tags'], 
			{ sort: { date: -1} }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (d) {

		  		// clean up dream, so we don't need to transmit all tags and characters
		  		var spaceCount = (d.dream.split(" ").length - 1);
		  		var stripDream = { _id: d._id, title: d.title, date: d.date, start: d.start, tag_cnt: d.tags.length, word_cnt: spaceCount, char_cnt: d.characters.length };
		  		if (stripDream.title == '') stripDream.title = d.start;
		  		all.allDreams.push(stripDream);

		  		// util.log("found dream: "+d);
		  	});

		  	// util.log("allDreams: "+ JSON.stringify(allDreams));
		  	response.writeHead(200, {'content-type': 'text/plain' });
			response.end(JSON.stringify(all));

		  }
		});
	}

	getDream = function(db,id,response) {
		util.log("POST 'one'");

		db.Dream.findOne( { _id: id }, function(err, doc) {
			if(err) {
				util.log("error finding dream: "+err.message);
				response.writeHead(200, {'content-type': 'text/plain' });
				response.end("error");
			}
			if(doc) {
				util.log("found dream: "+id);
				doc.title = doc.title;
				// doc.date = doc.date;
				// console.log("dream date: "+doc.date);

				response.writeHead(200, {'content-type': 'text/plain' });
				response.end(JSON.stringify(doc));
			}
		});
	}

	deleteDream = function(db,id,response) {
		util.log("POST 'delete'");
		db.Dream.findOne( { _id: id }, function(err, doc) {
			if(err) {
				util.log("error finding dream: "+err.message);
				response.writeHead(200, {'content-type': 'text/plain' });
				response.end("0");
			}
			if(doc) {
				doc.remove();
				response.writeHead(200, {'content-type': 'text/plain' });
				response.end('1');
			}
		});
	}

	// checkPW = function(db,data,response) {

	// }

	saveDream = function(db,data,response) {
		util.log("POST 'save'");

		try {
			util.log("handle Dream: "+JSON.stringify(data));
			var json = data;
			// util.log("json: "+json);

			if(json.id) {
				// save over old Dream
				db.Dream.findOne( { _id: json.id }, function(err, doc) {
					if(err) {
						util.log("Dream.findOne Error: "+err.message); 
						response.writeHead(200, {'content-type': 'text/plain' });
						response.end('0');
					}
					if(doc) {
						util.log("found dream: "+json.id);

						doc.title = json.title;
						doc.dream = json.dream;
						doc.date = json.date;
						doc.diary = json.diary;
						doc.start = json.dream.substring(0,50) + '...';
						doc.interpretation = json.interpretation;
						doc.sleep_type = json.sleep_type;
						doc.dream_type = json.dream_type;

						// save tags to dream array
						saveToArray(0, db.Tag, doc, doc.tags, json.tags, function(wdoc) {
							// save characters to dream array
							saveToArray(0, db.Character, wdoc, wdoc.characters, json.characters, function(tdoc) {
								// util.log("try saving");
								tdoc.save( function (err, sdoc) {
									if(err) { 
										util.log("Save Error: "+err.message); 
										response.writeHead(200, {'content-type': 'text/plain' });
										response.end('0');
									} else {
										util.log("Dream saved.");
										// util.log("callback : "+JSON.stringify(sdoc.tags));
										response.writeHead(200, {'content-type': 'text/plain' });
										response.end('1');
										// db.Dream.findOne( { _id: json.id }, function (err, ndoc) {
										// 	if(ndoc) {
										// 		util.log("found again: "+JSON.stringify(ndoc));
										// 	}
										// })
									}
								});
							})
						});
						// saveCharacters(db, doc, data.characters);

						
					}
				});

			} else {
				// save new Dream
				util.log("new dream");
				var d = new db.Dream();
				d.dream = json.dream;
				d.title = json.title;
				d.diary = json.diary;
				d.interpretation = json.interpretation;
				d.date = json.date;
				d.start = d.dream.substring(0,50) + '...';

				saveToArray(0, db.Tag, d, d.tags, json.tags, function(wdoc) {
					saveToArray(0, db.Character, wdoc, wdoc.characters, json.characters, function(tdoc) {
						// util.log("try saving");
						tdoc.save(function (err, doc) {
							if(err) { 
								util.log("Save Error: "+err.message); 
								response.writeHead(200, {'content-type': 'text/plain' });
								response.end('0');
							} else {
								util.log("Dream saved.");
								response.writeHead(200, {'content-type': 'text/plain' });
								response.end('1');
							}
						});
					});
				});

				
			}

			
			
		} catch(e) {
			util.log('Error parsing JSON data');
			response.writeHead(200, {'content-type': 'text/plain' });
			response.end('0');
		}
	}

	// add items to array list. works for: tags, characters
	saveToArray = function( counter, collection, odoc, oarray, tags, callback ) {

		// util.log(counter+ " | save tags : " + JSON.stringify(tags) );
		var d = tags.length;
		
		if(d && counter < d) {
			var tag = tags[counter].value;
			var dreamId = odoc._id;
			// util.log(counter+ " | look for tag: " + tag);

			collection.findOne( { name : tag }, function (err, doc) {
				if(err) util.error("Tag Find", err.message);
				
				if(doc) {
					// util.log("Tag '"+tag+"' was found");
					// check if reference exists in doc.tags-array
					var exists = false;
					if(oarray && oarray.length) {
						var tc = oarray.length;
						while(tc--) {
							var regTag = oarray[tc].tagId;
							if(String(regTag) == String(doc._id)) {
								exists = true;
							}
						}
					}

					// if not: make tag, add reference
					if(!exists) {
						// util.log("Tag reference not existant");
						oarray.push( {tagId: doc._id, name: doc.name });
					} else {
						// util.log("Tag reference already exists!");
					}

					// make sure dreamId is part of tag/character
					exists = false;
					// check if tag/characters dreams array already holds dream-id
					if(doc.dreams && doc.dreams.length) {
						var dc = doc.dreams.length;
						while(dc--) {
							var refDr = doc.dreams[dc].dreamId;
							if(String(refDr) == String(dreamId)) {
								exists = true;
							}
						}
					}
					if(!exists) {
						util.log("had to add dreamId to "+tag);
						doc.dreams.push( { dreamId: dreamId });
						doc.save(function (err, ddoc) {
							// if(ddoc) { util.log("tag saved."); }
						});
					}

					// end here, return to loop
					counter++;
					saveToArray( counter, collection, odoc, oarray, tags, callback );
					return;

				} else {
					// util.log("Tag '"+tag+"' was not found");

					// make new Tag
					var t = new collection();
					t.name = tag;
					oarray.push( {tagId: t._id, name: t.name });
					docId = t._id;

					// make sure dreamId is part of tag/character
					t.dreams.push( { dreamId: dreamId });

					t.save(function (err, tdoc) {
						if(err) util.error("Tag Save",err.message);
						if(tdoc) { 
							// util.log("Saved Tag "+tdoc.name); 
							// end here, return to loop
							counter++;
							saveToArray( counter, collection, odoc, oarray, tags, callback );
							return;
						}
					})

				}
				// add dream Id to tag/characters
			})

			
		} else {
			// cycled through all tags, return to main function to save original doc

			// first check on removal of tags is necessary
			if(oarray && oarray.length) {
				var tc = oarray.length;
				while(tc--) {
					var regTag = oarray[tc].name;
					// check if existing tag is also in new-tag array
					var inTag = false;
					var ac = tags.length;
					// util.log(JSON.stringify(tags));
					while(ac--) {
						var compTag = tags[ac].value;
						// util.log("compare: "+compTag+" to "+regTag);
						if(compTag == regTag) {
							inTag = true;
						}
					}
					if(!inTag) {
						// util.log("delete Tag "+regTag);
						oarray.splice(tc,1);
					}
					// util.log("inTag (" + regTag +") : "+ inTag);
				}
			}

			callback(odoc);
		}

	}


	return {
		
		all: 		all,
		getDream: 	getDream,
		deleteDream: deleteDream,
		saveDream: 	saveDream
		// checkPW: 	checkPW
		
	}

}