// ---------------------------------------
// Request Handlers
// ---------------------------------------

var util = require('util');
var Sentiment = require('sentiment');
var ObjectId = require('mongodb').ObjectID;

// const language = require('@google-cloud/language');
// const {LanguageServiceClient} = require('@google-cloud/language').v1;


exports.initialize = function() {

	viz = function(db,response) {

		// console.log("handle - viz");

		var all = { allDreams : [] };	
		var query = {};
		var sortcmd = {};

		db.Dream.find( query , ['date','sentiment'], 
			{ sort: sortcmd }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (d) {
		  		var stripDream = { _id: d._id, date: d.date, sentiment: d.sentiment };
		  		all.allDreams.push(stripDream);
		  	});

		  	// util.log("allDreams: "+ JSON.stringify(allDreams));
		  	response.writeHead(200, {'content-type': 'text/plain' });
			response.end(JSON.stringify(all));

		  }
		});
	}

	viz_tags = function(db,response) {

		// console.log("handle - viz_tags");

		var all = { allTags : [] };	
		var query = {};
		var sortcmd = {};

		db.Tag.find( query , ['name','sentiment', 'dreams'], 
			{ sort: sortcmd }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (t) {
		  		if(t.dreams.length > 7) {
			  		var stripTag = { _id: t._id, name: t.name, sentiment: t.sentiment, cnt: t.dreams.length };
			  		all.allTags.push(stripTag);
		  		}
		  	});

		  	// util.log("allDreams: "+ JSON.stringify(allDreams));
		  	response.writeHead(200, {'content-type': 'text/plain' });
			response.end(JSON.stringify(all));

		  }
		});
	}

	viz_chars = function(db,response) {

		var all = { allChars : [] };	
		var query = {};
		var sortcmd = {};

		db.Character.find( query , ['name','sentiment', 'dreams'], 
			{ sort: sortcmd }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (c) {
		  		if(c.dreams.length > 5) {
		  			// util.log("character added to viz: "+c.name);
			  		var stripChar = { _id: c._id, name: c.name, sentiment: c.sentiment, cnt: c.dreams.length };
			  		all.allChars.push(stripChar);
		  		}
		  	});
		  	response.writeHead(200, {'content-type': 'text/plain' });
			response.end(JSON.stringify(all));

		  }
		});
	}

	all = function(db,tag,character,sort,cflags,response) {
		util.log("POST 'all'");
		util.log("cflags: "+cflags);

		var all = { allDreams : []};	
		var all_tags = [];
		var all_chars = [];

		var query = {};
		if(tag=="false") tag = false;
		if(character=="false") character = false;
		if(tag) query['tags.name'] = tag;
		if(character) query['characters.name'] = character;
		if(cflags.charAt(0) == "1") query['content.recent'] = true;
		if(cflags.charAt(1) == "1") query['content.upcoming'] = true;
		if(cflags.charAt(2) == "1") query['content.stressful'] = true;
		if(cflags.charAt(3) == "1") query['content.surreal'] = true;
		if(cflags.charAt(4) == "1") query['content.scary'] = true;
		if(cflags.charAt(5) == "1") query['content.romantic'] = true;
		if(cflags.charAt(6) == "1") query['content.sexual'] = true;
		util.log("query: "+ JSON.stringify(query));


		var sortcmd = {};
		if(sort=="false") sortcmd['date'] = -1;
		if(sort=="date0") sortcmd['date'] = -1;
		if(sort=="date1") sortcmd['date'] = 1;
		if(sort=="title0") sortcmd['title'] = -1;
		if(sort=="title1") sortcmd['title'] = 1;
		if(sort=="tags0") sortcmd['lengthTags'] = -1;
		if(sort=="tags1") sortcmd['lengthTags'] = 1;
		if(sort=="chars0") sortcmd['lengthChars'] = -1;
		if(sort=="chars1") sortcmd['lengthChars'] = 1;
		if(sort=="words0") sortcmd['lengthWords'] = -1;
		if(sort=="words1") sortcmd['lengthWords'] = 1;
		if(sort=="score0") sortcmd['sentiment.score'] = -1;
		if(sort=="score1") sortcmd['sentiment.score'] = 1;
		if(sort=="comp0") sortcmd['sentiment.comparative'] = -1;
		if(sort=="comp1") sortcmd['sentiment.comparative'] = 1;
		if(sort=="magn0") sortcmd['sentiment.magnitude'] = -1;
		if(sort=="magn1") sortcmd['sentiment.magnitude'] = 1;


		// db.Dream.aggregate([
  // 				{$unwind: "$answers"}, 
  // 				{$group: {_id:"$_id", answers: {$push:"$answers"}, size: {$sum:1}}}, 
  // 				{$sort:{size:1}}], 

  		db.Dream.aggregate(
  			[
			        { "$project": {
			            "dream": 1,
			            "title": 1,
			            "date": 1,
			            "start": 1,
			            "characters": 1,
			            "tags": 1,
			            "lengthTags": { "$size": "$tags" },
			            "lengthChars" : { "$size": "$characters" },
			            "lengthWords" : { "$strLenCP": "$dream" },
			            "sentiment": 1,
			            "content": 1
			        }},
			        { "$match" : query },
			        { "$sort": sortcmd }
		    ],
		    function(err,docs) {
		      if(err) util.log("error: "+err.message);
			  if(docs) {
			  	var sentimentTotal = { "score": 0, "comparative": 0, "magnitude": 0 };
			  	docs.forEach( function (d) {
			  		// clean up dream, so we don't need to transmit all tags and characters
			  		var spaceCount = (d.dream.split(" ").length - 1);
			  		var stripDream = { _id: d._id, title: d.title, date: d.date, start: d.start, tag_cnt: d.tags.length, word_cnt: spaceCount, char_cnt: d.characters.length, sentiment: d.sentiment, content: d.content };
			  		sentimentTotal["score"] += d.sentiment.score;
			  		sentimentTotal["comparative"] += d.sentiment.comparative;
			  		sentimentTotal["magnitude"] += d.sentiment.magnitude;
			  		// all_tags.push(d.tags.name);
			  		d.tags.forEach( function (t) {
			  			all_tags.push(t.name);
			  		});
			  		d.characters.forEach( function (c) {
			  			all_chars.push(c.name);
			  		});
			  		if (stripDream.title == '') stripDream.title = d.start;
			  		all.allDreams.push(stripDream);

			  		// util.log("found dream: "+d);
			  	});

			  	sentimentTotal["score"] = sentimentTotal["score"]/docs.length;
			  	sentimentTotal["comparative"] = sentimentTotal["comparative"]/docs.length;
			  	sentimentTotal["magnitude"] = sentimentTotal["magnitude"]/docs.length;
			  	all.sentimentTotal = sentimentTotal;

			  	if(tag) all_tags = all_tags.filter(function (str) { return str.indexOf(tag) === -1; });
			  	all.top_tags = getTop10(all_tags);
			  	if(character) all_chars = all_chars.filter(function (str) { return str.indexOf(character) === -1; });
			  	all.top_chars = getTop10(all_chars);

			  	// util.log("top Tags: "+JSON.stringify(top_tags));
			  	// util.log("top Chars: "+JSON.stringify(top_chars));

			  	// util.log("allDreams: "+ JSON.stringify(allDreams));
			  	response.writeHead(200, {'content-type': 'text/plain' });
				response.end(JSON.stringify(all));

			  }
		    }
		);


		// db.Dream.find( query , ['dream','title','date','start','characters','tags'], 
		// 	{ sort: sortcmd }, 
		// 	function (err, docs) {
		//   if(err) util.log("error: "+err.message);
		//   if(docs) {
		//   	docs.forEach( function (d) {

		//   		// clean up dream, so we don't need to transmit all tags and characters
		//   		var spaceCount = (d.dream.split(" ").length - 1);
		//   		var stripDream = { _id: d._id, title: d.title, date: d.date, start: d.start, tag_cnt: d.tags.length, word_cnt: spaceCount, char_cnt: d.characters.length };
		//   		if (stripDream.title == '') stripDream.title = d.start;
		//   		all.allDreams.push(stripDream);

		//   		// util.log("found dream: "+d);
		//   	});

		//   	// util.log("allDreams: "+ JSON.stringify(allDreams));
		//   	response.writeHead(200, {'content-type': 'text/plain' });
		// 	response.end(JSON.stringify(all));

		//   }
		// });
	}


	getTop10 = function(array) {

		var map0 = array.reduce(function(p, c) {
		  p[c] = (p[c] || 0) + 1;
		  return p;
		}, {});

	  	let sortable = [];
		for (var m in map0) {
		    sortable.push([m, map0[m]]);
		}

		sortable.sort(function(a, b) {
		    return b[1] - a[1];
		});

	  	return sortable.slice(0,10);
	}

	getTags = function(db,response) {
		util.log("POST 'tags'");

		var tags = { allTags : [] };	

		db.Tag.find( 
			{ sort: { name: -1} }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (t) {
		  		// util.log(t.name);
		  		var stripTag = { name: t.name, cnt: t.dreams.length,  };
		  		tags.allTags.push(stripTag);
		  	});

			response.writeHead(200, {'content-type': 'text/plain' });
			response.end(JSON.stringify(tags));
		  }
		});

	}

	getChars = function(db,response) {
		util.log("POST 'characters'");

		var chars = { allChars: [] };	

		db.Character.find( 
			{ sort: { name: -1} }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (c) {
		  		var stripChar = { name: c.name, cnt: c.dreams.length,  };
		  		chars.allChars.push(stripChar);
		  	});

			response.writeHead(200, {'content-type': 'text/plain' });
			response.end(JSON.stringify(chars));
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
				// console.log(doc);
				doc.title = doc.title;		// ?!
				// doc.date = doc.date;
				// console.log("dream date: "+doc.date);


				response.writeHead(200, {'content-type': 'text/plain' });
				response.end(JSON.stringify(doc));

				// sentimentAnalysisGoogle(doc,function(rdoc) {
				// 	response.writeHead(200, {'content-type': 'text/plain' });
				// 	response.end(JSON.stringify(rdoc));
				// });
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
			// util.log("handle Dream: "+JSON.stringify(data));
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
						// doc.sleep_type = json.sleep_type;
						// doc.dream_type = json.dream_type;
						doc.content.recent = json.content.recent;
						doc.content.upcoming = json.content.upcoming;
						doc.content.stressful = json.content.stressful;
						doc.content.surreal = json.content.surreal;
						doc.content.scary = json.content.scary;
						doc.content.romantic = json.content.romantic;
						doc.content.sexual = json.content.sexual;

						// do sentiment analysis on main text 
						sentimentAnalysis(doc, function(sdoc) {
							// save tags to dream array
							saveToArray(0, db.Tag, sdoc, sdoc.tags, json.tags, function(wdoc) {
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

				d.content.recent = json.content.recent;
				d.content.upcoming = json.content.upcoming;
				d.content.stressful = json.content.stressful;
				d.content.surreal = json.content.surreal;
				d.content.scary = json.content.scary;
				d.content.romantic = json.content.romantic;
				d.content.sexual = json.content.sexual;

				sentimentAnalysis(d, function(sdoc) {
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
					})
				});

				
			}

			
			
		} catch(e) {
			util.log('Error parsing JSON data');
			response.writeHead(200, {'content-type': 'text/plain' });
			response.end('0');
		}
	}

	updateAllDreams = function(db) {
		console.log("update all dreams");

		db.Dream.find( 
			{ sort: { name: -1} }, 
			function (err, docs) {
		  		if(err) util.log("error: "+err.message);
		  		if(docs) {
		  			docs.forEach( function (d) {
		  				console.log(d.title);
		  				sentimentAnalysis(d, function(sdoc) {
		  					sdoc.save(function (err, doc) {
								if(err) { 
									console.log("Save Error: "+err.message); 
								} else {
									console.log("Dream saved.");
								}
							});
		  				});
		  			});
				}
			}
		);
	}

	updateAllTags = function(db) {
		console.log("update all tags");

		db.Tag.find( 
			{ sort: { name: -1} }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (t) {


		  		var dreams_ids = t.dreams.map(function(item){
				    return item['dreamId'];
				});
		  		// util.log("dreams ids: "+dreams_ids);

		  		var sentimentTotal = { "score": 0, "comparative": 0, "magnitude": 0 };

		  		db.Dream.find( { _id: { $in: dreams_ids } }, function(err, ds) {
					if(err) {
						util.log("error finding dream: "+err.message);
						response.writeHead(200, {'content-type': 'text/plain' });
						response.end("error");
					}
					if(ds) {
		  				util.log(t.name + ": " + ds.length + " dreams. ");
						// util.log("found "+ds.length+" dreams");
						ds.forEach( function (d) {
					  		// util.log("dream: " + d.title)
							sentimentTotal["score"] += d.sentiment.score;
				  			sentimentTotal["comparative"] += d.sentiment.comparative;
				  			sentimentTotal["magnitude"] += d.sentiment.magnitude;
					  	});
					}

		  		sentimentTotal["score"] = sentimentTotal["score"]/ds.length;
			  	sentimentTotal["comparative"] = sentimentTotal["comparative"]/ds.length;
			  	sentimentTotal["magnitude"] = sentimentTotal["magnitude"]/ds.length;
			  	// all.sentimentTotal = sentimentTotal;
			  	t.sentiment = sentimentTotal;
			  	t.save(function (err, ddoc) {
				});

			  	util.log("avg score: "+sentimentTotal["score"]);
			  	util.log("avg comparative: "+sentimentTotal["comparative"]);
			  	util.log("avg magnitude: "+sentimentTotal["magnitude"]);

				});
		  	});
		  }
		});

	}


	updateAllCharacters = function(db) {
		console.log("update all characters");

		db.Character.find( 
			{ sort: { name: -1} }, 
			function (err, docs) {
		  if(err) util.log("error: "+err.message);
		  if(docs) {
		  	docs.forEach( function (c) {

		  		var dreams_ids = c.dreams.map(function(item){
				    return item['dreamId'];
				});
		  		// util.log("dreams ids: "+dreams_ids);

		  		var sentimentTotal = { "score": 0, "comparative": 0, "magnitude": 0 };

		  		db.Dream.find( { _id: { $in: dreams_ids } }, function(err, ds) {
					if(err) {
						util.log("error finding dream: "+err.message);
						response.writeHead(200, {'content-type': 'text/plain' });
						response.end("error");
					}
					if(ds) {
		  				util.log(c.name + ": " + ds.length + " dreams. ");
						// util.log("found "+ds.length+" dreams");
						ds.forEach( function (d) {
					  		// util.log("dream: " + d.title)
							sentimentTotal["score"] += d.sentiment.score;
				  			sentimentTotal["comparative"] += d.sentiment.comparative;
				  			sentimentTotal["magnitude"] += d.sentiment.magnitude;
					  	});
					}

		  		sentimentTotal["score"] = sentimentTotal["score"]/ds.length;
			  	sentimentTotal["comparative"] = sentimentTotal["comparative"]/ds.length;
			  	sentimentTotal["magnitude"] = sentimentTotal["magnitude"]/ds.length;
			  	// all.sentimentTotal = sentimentTotal;
			  	c.sentiment = sentimentTotal;
			  	c.save(function (err, ddoc) {
				});

			  	util.log("avg score: "+sentimentTotal["score"]);
			  	util.log("avg comparative: "+sentimentTotal["comparative"]);
			  	util.log("avg magnitude: "+sentimentTotal["magnitude"]);

				});
		  	});
		  }
		});

	}


	sentimentAnalysis = function (odoc, callback) {
		var sentiment = new Sentiment();
		var phrase = odoc.dream.replace(/#|@/g,'');
		var options = { language: 'en' };
		var result = sentiment.analyze(phrase, options );
		odoc.sentiment.score = result.score;
		odoc.sentiment.comparative = result.comparative;
		odoc.sentiment.magnitude = result.words.length / result.tokens.length;
		console.log("\nSENTIMENT ANALYSIS");
		console.log("\tscore: "+result.score+"\tcomparative: "+result.comparative.toFixed(2)+"\tmagnitude: "+odoc.sentiment.magnitude.toFixed(2)+"\n");
		console.log("\tpositive words: "+result.positive);
		console.log("\tnegative words: "+result.negative);
		callback(odoc);
	}

	sentimentAnalysisGoogle = async function( dream, callback ) {
		// const client = new language.languageServiceClient({
		const client = new LanguageServiceClient({
			projectID:'sonic-ivy-368322',
			keyFilename: 'credentials/sonic-ivy-368322-d42c1a451c02.json'
		});
		const document = {
			content: dream.dream.replace(/#|@/g,''),
			type: 'PLAIN_TEXT',
		};
		// Detects the sentiment of the text
  		const [result] = await client.analyzeSentiment({document: document});
  		const sentiment = result.documentSentiment;
		console.log("SENTIMENT ANALYSIS \nscore: "+sentiment.score+" magnitude: "+sentiment.magnitude+"\n");

		dream.sentiment.score = sentiment.score;
		dream.sentiment.magnitude = sentiment.magnitude;


  		// const [result2] = await client.analyzeEntities({document: document});
  		// const entities = result2.entities;
  		// // console.log(entities);
  		// entities.forEach(entity => {
  		// 	console.log(entity.name + ": \tType: "+entity.type+"\tSalience: "+entity.salience+"\tmentions: "+entity.mentions.length);
  		// });

  		const [result3] = await client.analyzeEntitySentiment({document: document});
  		const entities2 = result3.entities;
  		console.log("ENTITY SENTIMENT ANALYSIS");
  		// entities2.forEach(entity => {
  		// 	console.log("- "+entity.name + ": \tType: "+entity.type+"\tSalience: "+entity.salience+"\tmentions: "+entity.mentions.length+"\tsentiment score: "+entity.sentiment.score+"  magnitude: "+entity.sentiment.magnitude);
  		// });
  		// console.log("\n");
  		console.log(entities2);
  		dream.entities = result3.entities;



  		const classificationModelOptions = {
			v2Model: {
				contentCategoriesVersion: 'V2',
			},
		};
		const [classification] = await client.classifyText({document, classificationModelOptions});
		console.log("CONTENT CLASSIFICATION:");
		// classification.categories.forEach(category => {
		// 	console.log("---> "+category.name + "   Confidence: "+category.confidence);
		// });
		// console.log("\n");
		console.log(classification.categories);
		dream.categories = classification.categories;



		// console.log(dream);

  		callback(dream);
  		// return sentiment;
		// console.log("Sentiment score: "+sentiment.score);
		// console.log("Sentiment magnitude:" +sentiment.magnitude);

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
		viz: 		viz, 
		viz_tags: 	viz_tags, 
		viz_chars: 	viz_chars, 
		getTags: 	getTags,
		getChars: 	getChars,
		getDream: 	getDream,
		deleteDream: deleteDream,
		saveDream: 	saveDream,
		updateAllDreams: 	updateAllDreams,
		updateAllTags: 		updateAllTags,
		updateAllCharacters: updateAllCharacters
		// checkPW: 	checkPW
		
	}

}