
// --------------------------
// dlog 2011
// --------------------------

(function($){

	url = window.location.host;
	console.log("url: "+url);
	url = 'http://'+ url;
	var pass;
	// url = "http://localhost:8010";


	start = function( space ) {

		// check cookie to see if password has been set already
		pass = getCookie('dlogcookie');
		if(pass === null) { 
			pass = prompt("Moderation Password","");
			$.post(url, '{ "req" : "checkpw", "pass" : "'+pass+'" }', function(response) {
				console.log('POST reponse: '+response);
				if(response=='1') {
					console.log('Password correct');
				} else {
					alert("incorrect password");
					console.log('Password incorrect');
				}
			});
			setCookie('dlogcookie', pass, 7);
		}


		/* -------- display ONE dream --------- */
		if(space == 'one') {
			// GET id parameter

			

			$.urlParam = function(name){
				var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
				if (!results) { return 0; }
				return results[1] || 0;
			}

			var id = $.urlParam('id') || false;
			var edit = $.urlParam('edit') || false;
			if(!id) edit = true;
			console.log("id: "+id);
			console.log("edit: "+edit);

			doEdit(edit);

			if(id) {
				$('h1').text("Load dream");
				$('#dream .inputText textarea').val('');

				console.log("POST request");
				$.post(url, '{ "req" : "one", "id" : "'+id+'", "pass" : "'+pass+'" }', function(response) {
					var dream = JSON.parse(response);
					// console.log("dream: " + JSON.stringify(dream));
					loadDream(dream);
					highlightTag($("#dream textarea"));
				});

			} else {
				clearForm();
				$('h1').text("New dream");
				$('#title').val('New Dream Title');
				$('#submit').text('Submit Dream');
				$("#sidebar").data('tags', []);
				$("#sidebar").data('characters', []);
			}

			$('#submit').click( function() {
				if(edit) {
					console.log("Save Dream");
					saveData(id, function() {
						edit = false;
						doEdit(edit);
					});
				} else {
					console.log("Make Editable");
					$('h1').text("Edit dream");
					edit = true;
					doEdit(edit);
				}
			});

			$('input, textarea').change( function() {
				console.log("change");
				newTags();
				// $('#submit').removeAttr("disabled");
			});

			$("#dream textarea").on({
				'scroll': handleScroll
			});

			// $('#dream').keyup( function() {
			// 	console.log("#dream keyUP");
			// 	$('#title').val("The M");
			// 	$(this).val( "<span class='hi'>abc" + $(this).val() + "</span>" );
			// 	// $(this).html( $(this).text().replace( 
			// 	// 	new RegExp('this'), "gi"),
			// 	// 	function(match) {
			// 	// 		// return match;
			// 	// 		return ["<span class='hi'>", match, "</span>"].join("");
			// 	// 	}));
			// });

			$("#dream textarea").keyup( function(e) {
				// console.log("highlight keys: "+e+"  type: "+typeof e);
				// console.log(e.keyCode);
				if(e.keyCode == 32) newTags();
				highlightTag($("#dream textarea"));
			})

			$('#inputDate').css('width', '105px');

			$("#tags ul li").live("click", function() {
				var tagName = $(this).text();
				window.location = "all?tag=" + tagName;
			});

			$("#characters ul li").live("click", function() {
				var charName = $(this).text();
				window.location = "all?character=" + charName;
			});

		}


		/* -------- tags and characters --------- */
		if(space == 'tags'){

			$('#tags.tagcloud ul').html('');

			console.log("POST request all tags");
			// load all tags into page
			$.post(url, '{ "req" : "tags", "pass" : "'+pass+'" }', function(response) {
				var tags = JSON.parse(response);
				// sort in descending order
				tags.allTags.sort(function(a, b) {
				    return parseFloat(b.cnt) - parseFloat(a.cnt);
				});
				$("#tags h3").append(" ("+tags.allTags.length+")");
				tags.allTags.forEach( function(t) {
					$('#tags.tagcloud ul').append("<li data-name=" + t.name+">" + t.name + " (" + t.cnt+")</li>");
				});
			});


			$("#tags ul li").live("click", function() {
				var tagName = $(this).data('name');
				window.location = "all?tag=" + tagName;
			});


		}

		if(space == 'chars'){

			$('#characters.tagcloud ul').html('');

			console.log("POST request all characters");
			// load all characters into page
			$.post(url, '{ "req" : "chars", "pass" : "'+pass+'" }', function(response) {
				var chars = JSON.parse(response);
				// sort in descending order
				chars.allChars.sort(function(a, b) {
				    return parseFloat(b.cnt) - parseFloat(a.cnt);
				});
				$("#characters h3").append(" ("+chars.allChars.length+")");
				chars.allChars.forEach( function(c) {
					$('#characters.tagcloud ul').append("<li data-name=" + c.name+">@" + c.name + " (" + c.cnt+")</li>");
				});
			});


			$("#characters ul li").live("click", function() {
				var charName = $(this).data('name');
				window.location = "all?character=" + charName;
			});

		}


		if(space == 'viz') {

			// console.log("main - viz");

			$.post(url, '{ "req" : "viz", "pass" : "'+pass+'" }', function(response) {
				var all = JSON.parse(response);
				// console.log('all response '+all);
				var chartData = [];
				var i = 0;

				all.allDreams.forEach( function(d) {

					var dreamDate = new Date(d.date);
					var todayDate = new Date();
					var diff = Math.round((todayDate - dreamDate) / (1000 * 60 * 60 * 24));
					// var dreamMonth = dreamDate.getFullYear() +'/'+dreamDate.getMonth();
					var newDate = new Date(dreamDate.getFullYear(), dreamDate.getMonth(), dreamDate.getDate());
					// chartData[i] = [dreamDate.getTime()/(1000 * 60 * 60 * 24), d.sentiment.score];
					chartData[i] = [dreamDate.getTime(), d.sentiment.comparative];
					i++;

				});

				// console.log(chartData);

				$(document).ready(function(){
				    setTimeout(function() {
			        	drawChart(chartData);
				    }, 500);
				});

			});



			
		}


		/* -------- all --------- */
		if(space == 'all') {

			$.urlParam = function(name){
				var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
				if (!results) { return 0; }
				return results[1] || 0;
			}

			var tag = $.urlParam('tag') || false;
			var character = $.urlParam('character') || false;
			var sort = $.urlParam('sort') || false;
			if(tag) $('h1').append(" / tag: "+tag);
			if(character) $('h1').append(" / character: "+character);


			var firstMonth = new Date(2010,1,1);
			firstMonth.setDate(1);
			var lastMonth = new Date(Date.now());
			lastMonth.setDate(1);
			var dream_by_month = new Array(); 
			var m = 0;
			for ( var dd = firstMonth; dd <= lastMonth; dd.setMonth(dd.getMonth() + 1)) {
				dream_by_month[m] = {date: dd.getFullYear() +'/'+dd.getMonth(), count: 0 };
				m++;
			};
			var months = m;

			// load all dreams into page
			$.post(url, '{ "req" : "all", "tag" : "'+tag+'", "character" : "'+character+'", "sort" : "'+sort+'", "pass" : "'+pass+'" }', function(response) {
				var all = JSON.parse(response);
				// console.log('all response '+all);

				var h = '';
				var b = ''
				all.allDreams.forEach( function(d) {
					// 
					var dreamDate = new Date(d.date);
					var dreamMonth = dreamDate.getFullYear() +'/'+dreamDate.getMonth();

					for (var i=0; i<dream_by_month.length; i++) {
						if (dream_by_month[i].date == dreamMonth) {
							dream_by_month[i].count += 1;
							break;
						}
					}

					h = '<div id="dream" class="drC" data-id="'+ d._id +'">';
					h += '<div id="date">' + formatDate(d.date) + '</div>';
					h += '<div id="title">' + d.title + '</div>';
					h += '<div id="characters">' + 'C (' + d.char_cnt+')' + '</div>';
					h += '<div id="tags">' + 'T ('+d.tag_cnt+')' + '</div>';
					h += '<div id="words">' + 'W ('+d.word_cnt+')' + '</div>';
					h += '<div id="content" '+(d.content.recent?'class="content1" title="Recent event"':'')+'> </div>';
					h += '<div id="content" '+(d.content.upcoming?'class="content1 title="Upcoming event""':'')+'> </div>';
					h += '<div id="content" '+(d.content.stressful?'class="content1 title="Stressful""':'')+'> </div>';
					h += '<div id="content" '+(d.content.surreal?'class="content1" title="Surreal"':'')+'> </div>';
					h += '<div id="content" '+(d.content.scary?'class="content1" title="Scary"':'')+'> </div>';
					h += '<div id="content" '+(d.content.romantic?'class="content1" title="Romantic"':'')+'> </div>';
					h += '<div id="content" '+(d.content.sexual?'class="content1" title="Sexual"':'')+'> </div>';
					h += '<div id="score">' + 'S: '+d.sentiment.score+'</div>';
					h += '<div id="comparative">' + 'C: '+d.sentiment.comparative.toFixed(2)+'</div>';
					h += '<div id="magnitude">' + 'M: '+(d.sentiment.magnitude*100).toFixed(0)+'%</div>';
					// h += '<div id="score">' + d.sentiment.score+'</div>';
					// h += '<div id="comparative">' +d.sentiment.comparative.toFixed(2)+'</div>';
					// h += '<div id="magnitude">' +(d.sentiment.magnitude*100).toFixed(0)+'%</div>';
					h += '<div id="buttons">';
					h += '<div id="edit">edit</div>';
					h += '<div id="delete">x</div>';
					h += '</div>';
					h += '</div>';
					$(h).appendTo('#archive');
				});
				//.ready( function() { console.log("ready"); });

				$('h1').append(" ("+all.allDreams.length+")");

				$("#edit").live("click", function() {
					var id = $(this).parent().parent().data('id');
					console.log("click EDIT " + id);
					window.location = "one.html?edit=1&id=" + id;
				});

				$("#delete").live("click", function() {
					if(confirm("Are you sure you want to delete this dream?")) {
		    			console.log("delete dream " + $(this).parent().parent().data('id'));
						deleteDream($(this).parent().parent().data('id'), $(this).parent().parent(), function(obj) {
							$(obj).remove();
						});
					}
				})

				$("#title").live("click", function() {
					var id = $(this).parent().data('id');
					console.log("click TITLE " + id);
					window.location = "one.html?id=" + id;
				})


		        var chartData = [];
		        for (var i=0; i<dream_by_month.length; i++) { 
		        	chartData[i] = [dream_by_month[i].date, dream_by_month[i].count];
		        };

				$(document).ready(function(){
				    setTimeout(function() {
			        	drawChart('Dreams', chartData);
				    }, 500);
				});

			});

		}

	}


	function handleScroll() {

		var scrollTop = $("#dream textarea").scrollTop();
		console.log("handleScroll "+scrollTop);
		$("#dream .highlight").scrollTop(scrollTop);
	}

	function highlightKeys(t) {
		var textval = $(t).val();
		var markedup = textval.replace(/(this)/g, "<b><span>$1</span></b>");
		// make up for the fact that ie loses the whitespace:pre after setting html
	    // markedup = markedup.replace(/ {2}/g, '&nbsp; ');
		$("#dream #echoer").html(markedup);
	}

	function highlightTag(t) {
			var textval = $(t).val();
			var markedup = textval.replace( /(^|\s)(#\w+)/g, "$1<b><span>$2</span></b>" );
			markedup = markedup.replace( /(^|\s)(@\w+)/g, "$1<i><span>$2</span></i>" );
			markedup = markedup.replace(/\n$/g, '\n\n'); 	// fixes a bug where a trailing carriage return causes the highlights <div> to become misaligned
			$("#dream #echoer").html(markedup);
		}

	function newTags() {
		console.log("new tags");
		// cycle through all Tags to see if they are still valid
		cleanTags('tags');
		cleanTags('characters');
		

		$("#dream #echoer b").each( function() {
			// console.log( $(this).text() );
			addTag('tags', $(this).text().substring(1) );
		})
		$("#dream #echoer i").each( function() {
			// console.log( $(this).text() );
			addTag('characters', $(this).text().substring(1) );
		})
	}

	function doEdit(v) {
		
		console.log("doEdit");
		$('#submit').text( v ? 'Save' : 'Edit');

		if(!v) {
			$("#dream #echoer").removeClass('hide');
			$('#mainbar').addClass('noEdit');
			$('input:radio[name=typesleep]').attr('disabled',true);
			$('input:radio[name=typedream]').attr('disabled',true);
			$('input, textarea').attr("readonly", "readonly");
			$( "#inputDate" ).prop('disabled', true);
			$('input[type="checkbox"]').prop('disabled', true);
			console.log("enabled");
		} else {
			$("#dream #echoer").addClass('hide');
			$('#mainbar').removeClass('noEdit');
			$('input:radio[name=typesleep]').attr('disabled',false);
			$('input:radio[name=typedream]').attr('disabled',false);
			$('input, textarea').removeAttr("readonly");
			$('#submit').attr("disabled", "disabled");
			$( "#inputDate" ).prop('disabled', false);
			$('input[type="checkbox"]').prop('disabled', false);
			console.log("disabled");
		}
		// console.log("data has class noEdit: "+$('#data').hasClass('noEdit'));
	}

	function clearForm() {
		$('#title').val('');
		$('#dream .inputText textarea').val('');
		$('#dream #echoer').text('');
		$('#diary').val('');
		$('#interpretation').val('');
		$('#inputDate').val(formatDate(new Date()));
	}

	function loadDream(dream) {
		$('#title').val(dream.title);
		$('#dream .inputText textarea').val(dream.dream);
		$('#diary').val(dream.diary);
		$('#title').val(dream.title);
		$('#interpretation').val(dream.interpretation);
		$('#inputDate').val(formatDate(dream.date));
		$('#score').html("Score: "+(dream.sentiment.score).toFixed(0));
		$('#comparative').html("Comparative: "+(dream.sentiment.comparative).toFixed(3));
		$('#magnitude').html("Magnitude: "+(dream.sentiment.magnitude*100).toFixed(0)+"%");
		$('#content_recent').prop('checked', dream.content.recent);
		$('#content_upcoming').prop('checked', dream.content.upcoming);
		$('#content_stressful').prop('checked', dream.content.stressful);
		$('#content_surreal').prop('checked', dream.content.surreal);
		$('#content_scary').prop('checked', dream.content.scary);
		$('#content_romantic').prop('checked', dream.content.romantic);
		$('#content_sexual').prop('checked', dream.content.sexual);

		var tags =  dream.tags;
		var characters = dream.characters;
		// var categories = dream.categories;
		makeTags('tags', tags);
		makeTags('characters', characters);
		// makeTags('categories', categories);
		// var entities = dream.entities;
		// makeEntities('entities', entities);

	}

	function formatDate(dday) {
		// console.log("dday : "+dday);
		var date = new Date(dday);
		var d = date.getDate();
		d = (d < 10) ? ("0" + d) : d;
		var m = date.getMonth()+1;
		m = (m < 10) ? ("0" + m) : m;
		var y = date.getFullYear();
		return m + '/' + d + '/' + y;
	}



	// function makeEntities(id, entities) {
	// 	// // PERSON, LOCATION, ORGANIZATION, EVENT, OTHER
	// 	$('#' + id).html('');
	// 	makeTypeEntities(id,'PERSON', entities);
	// 	makeTypeEntities(id,'LOCATION', entities);
	// 	makeTypeEntities(id,'ORGANIZATION', entities);
	// 	makeTypeEntities(id,'EVENT', entities);
	// 	makeTypeEntities(id,'WORK_OF_ART', entities);
	// 	makeTypeEntities(id,'CONSUMER_GOOD', entities);
	// 	makeTypeEntities(id,'OTHER', entities);
	// 	makeTypeEntities(id,'PHONE_NUMBER', entities);
	// 	makeTypeEntities(id,'ADDRESS', entities);
	// 	makeTypeEntities(id,'DATE', entities);
	// 	makeTypeEntities(id,'NUMBER', entities);
	// 	makeTypeEntities(id,'PRICE ', entities);
	// 	makeTypeEntities(id,'UNKNOWN ', entities);
	// 	// makeTypeEntities(id,'PERSON', entities);
	// }

	// function makeTypeEntities(id, type, entities) {
	// 	var list = [];
	// 	for(var i=0; i<entities.length; i++) {
	// 		if(entities[i].type == type && entities[i].salience > 0.03 && list.indexOf(entities[i].name)==-1) {
	// 			list.push(entities[i].name);
	// 		}
	// 	}
	// 	if(list.length>0) {
	// 		$('#' + id + '.tagcloud').append(type);
	// 		var innerList = "";
	// 		for(var j=0; j<list.length; j++) {
	// 			innerList += "<li>" + list[j] + "</li>";
	// 		}
	// 		$('#' + id + '.tagcloud').append("<ul>" + innerList + "</ul>");
	// 	}
	// }

	function makeTags(id, tags) {
		console.log("makeTags: "+JSON.stringify(tags));
		$("#sidebar").data(id, []);

		$('#' + id + '.tagcloud ul').html('');
		for(var i=0; i<tags.length; i++) {
			addTag(id, tags[i].name);
		}
	}

	function addTag(id, t) {
		// check if Tag is already in the list
		// console.log("addTag '" + t + "' to " + id);
		var array = $("#sidebar").data(id);
		if(array) {
			for(var i=0; i<array.length; i++) {
				if(array[i].value == t) {
					return;
				}
			}
		}
		
		t = t;
		array.push( { "value" : t } );
		$("#sidebar").data(id, array);
		// console.log("array pushed " +t + " / " + JSON.stringify(array));
		
		$('#' + id + '.tagcloud ul').append("<li>" + t + "</li>");
	}

	function deleteTag(id, t) {
		$('#' + id + '.tagcloud ul li').each( function () {
			if( $(this).text() == t) {
				$(this).remove();
				console.log(id + " delete "+ t);
			}
			// console.log("cycle "+ $(this).text());
		});
	}

	function cleanTags(id) {
		var array = $("#sidebar").data(id);	// { "value" : t }
		// console.log("cleanTags: " + id +"-array: "+array);
		if(array) {
			var i = array.length;
			while(i--) {
				var tagname = array[i].value;
				// console.log("look for #" + tagname);
				
				var lookfor = (id === 'tags') ? '#' : '@';
				lookfor += array[i].value;
				var compText = $("#dream textarea").val();
				// var results = new RegExp(lookfor).test(compText);
				var results = new RegExp(`\\b${lookfor}\\b`, 'i').test(compText);
				// console.log("results : "+results);
				if(!results) {
					// delete Tag from list
					array.splice(i,1);
					deleteTag(id, tagname);
				}
			}
		}
	}

	function saveData(id, callback) {
		dreamData = getData( 'save', id );

		$.post(url, JSON.stringify(dreamData), function(response) {
			console.log('POST reponse: '+response);
			if(response=='1') {
				console.log('Success!');
				// clearForm();
				$('#log').html('Dream was successfully saved.');
				callback();
			} else {
				$('#log').html('An error occured when trying to add the dream to the database.');
			}
		});
	}

	function getData( handle, id ) {
		console.log("getData()");
		var dream = $('#dream .inputText textarea').val();
		var diary = $('#diary').val();
		var title = $('#title').val();
		var interpretation = $('#interpretation').val();
		var date = $('#inputDate').val();
		var id = id || null;
		var tags = $('#sidebar').data('tags');
		var characters = $('#sidebar').data('characters');
		var content = {
			recent: $('#content_recent').prop('checked'),
			upcoming: $('#content_upcoming').prop('checked'),
			stressful: $('#content_stressful').prop('checked'),
			surreal: $('#content_surreal').prop('checked'),
			scary: $('#content_scary').prop('checked'),
			romantic: $('#content_romantic').prop('checked'),
			sexual: $('#content_sexual').prop('checked')
		};
		// var sleep_type = $('input:radio[name=typesleep]:checked').val();
		// var dream_type = $('input:radio[name=typedream]:checked').val();

		var dreamData = { req : handle, data : {
			"dream" : dream,
			"diary" : diary,
			"title" : title,
			"interpretation" : interpretation,
			"date" : date,
			"id" : id,
			"tags" : tags,
			"characters" : characters,
			"content" : content
			// "sleep_type" : sleep_type,
			// "dream_type" : dream_type
		}, pass : pass};

		return dreamData;
	}

	function deleteDream( id, obj, callback ) {
		var dreamData = { req : 'delete', id : id, pass : pass };

		$.post(url, JSON.stringify(dreamData), function(response) {
			console.log('POST reponse: '+response);
			if(response=='1') {
				console.log('Delete Success!');
				// clearForm();
				$('#log').html('Dream was successfully deleted.');
				callback(obj);
			} else {
				$('#log').html('An error occured when trying to delete the dream from the database.');
			}
		});
	}

	function setCookie(name,value,days) {
	    if (days) {
	        var date = new Date();
	        date.setTime(date.getTime()+(days*24*60*60*1000));
	        var expires = "; expires="+date.toGMTString();
	    }
	    else var expires = "";
	    document.cookie = name+"="+value+expires+"; path=/";
	}

	function getCookie(name) {
	    var nameEQ = name + "=";
	    var ca = document.cookie.split(';');
	    for(var i=0;i < ca.length;i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1,c.length);
	        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	    }
	    return null;
	}

	function deleteCookie(name) {
	    setCookie(name,"",-1);
	}


})(jQuery);