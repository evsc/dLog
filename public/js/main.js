
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
					var hide = (t.name).replace(/./g, '*');
					hide = t.name;
					$('#tags.tagcloud ul').append("<li data-name=" + t.name+">" + hide + " (" + t.cnt+")</li>");
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
					var hide = (c.name).replace(/./g, '*');
					hide = c.name;
					$('#characters.tagcloud ul').append("<li data-name=" + c.name+">@" + hide + " (" + c.cnt+")</li>");
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
					// var todayDate = new Date();
					// var diff = Math.round((todayDate - dreamDate) / (1000 * 60 * 60 * 24));
					// var dreamMonth = dreamDate.getFullYear() +'/'+dreamDate.getMonth();
					// var newDate = new Date(dreamDate.getFullYear(), dreamDate.getMonth(), dreamDate.getDate());
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


		if(space == 'viz_tags') {

			$.post(url, '{ "req" : "viz_tags", "pass" : "'+pass+'" }', function(response) {
				var all = JSON.parse(response);
				// console.log('all response '+all);
				var chartData = [];
				var i = 0;
				// var style = "point { size: 12; shape-type: circle; fill-color: #FFFFFF; color: #CCCCCC }";

				all.allTags.forEach( function(t) {
					var cnt = t.cnt;
					if(cnt>10) cnt = 10;
					cnt = 0;
					chartData[i] = [ t.sentiment.magnitude, t.sentiment.comparative, "point { size: " +cnt+ "; }", t.name];
					i++;
				});

				$(document).ready(function(){
				    setTimeout(function() {
			        	drawTagChart(chartData);
				    }, 750);
				});

			});
			
		}

		if(space == 'viz_chars') {

			$.post(url, '{ "req" : "viz_chars", "pass" : "'+pass+'" }', function(response) {
				var all = JSON.parse(response);
				var chartData = [];
				var i = 0;

				all.allChars.forEach( function(c) {
					// var hide = (c.name).replace(/./g, '*');
					var hide = (c.name).replace(/(?<!^)./g, '*');
					hide = c.name;
					chartData[i] = [ c.sentiment.magnitude, c.sentiment.comparative, "point { size: 0; }", hide];
					i++;
				});

				// util.log("character to chartData ");

				$(document).ready(function(){
				    setTimeout(function() {
			        	drawCharacterChart(chartData);
				    }, 1000);
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
			var startDateExists = $.urlParam('startDate') || false;
			var endDateExists = $.urlParam('endDate') || false;
			
			var startDate = startDateExists ? new Date(decodeURIComponent(startDateExists)) : new Date(2003,1,1);
			var endDate = endDateExists ? new Date(decodeURIComponent(endDateExists)) : new Date(Date.now());

			if(tag) $('h1').append(" / tag: "+tag);
			if(character) $('h1').append(" / character: "+character);

			// content flags 
			var cflags = {
				recent: parseInt($.urlParam('cf1'))==1,
				upcoming: parseInt($.urlParam('cf2'))==1,
				stressful: parseInt($.urlParam('cf3'))==1,
				surreal: parseInt($.urlParam('cf4'))==1,
				scary: parseInt($.urlParam('cf5'))==1,
				romantic: parseInt($.urlParam('cf6'))==1,
				sexual: parseInt($.urlParam('cf7'))==1
			};


			$('#content_recent').prop('checked', cflags.recent);
			$('#content_upcoming').prop('checked', cflags.upcoming);
			$('#content_stressful').prop('checked', cflags.stressful);
			$('#content_surreal').prop('checked', cflags.surreal);
			$('#content_scary').prop('checked', cflags.scary);
			$('#content_romantic').prop('checked', cflags.romantic);
			$('#content_sexual').prop('checked', cflags.sexual);

			cflagstring = "";
			cflagstring += cflags.recent ? 1 : 0;
			cflagstring += cflags.upcoming ? 1 : 0;
			cflagstring += cflags.stressful ? 1 : 0;
			cflagstring += cflags.surreal ? 1 : 0;
			cflagstring += cflags.scary ? 1 : 0;
			cflagstring += cflags.romantic ? 1 : 0;
			cflagstring += cflags.sexual ? 1 : 0;

			var firstMonth = new Date(startDate);
			firstMonth.setDate(1);
			var lastMonth = new Date(endDate);
			lastMonth.setDate(1);
			var dream_by_month = new Array(); 
			var m = 0;
			for ( var dd = firstMonth; dd <= lastMonth; dd.setMonth(dd.getMonth() + 1)) {
				dream_by_month[m] = {date: dd.getFullYear() +'/'+dd.getMonth(), count: 0 };
				m++;
			};
			var months = m;

			var count_cflags = new Array();
			for( var f = 0; f<7; f++) count_cflags[f]=0;

			$('#startDate').val(formatDate(startDate));
			$('#endDate').val(formatDate(endDate));
			// console.log("startDate: "+startDate+ " ... "+formatDate(startDate));
			// console.log("endDate: "+endDate+ " ... "+formatDate(endDate));

			// load all dreams into page
			$.post(url, '{ "req" : "all", "tag" : "'+tag+'", "character" : "'+character+'", "sort" : "'+sort+'", "pass" : "'+pass+'", "cflags" : "'+cflagstring+'", "startDate" : "'+startDateExists+'", "endDate" : "'+endDateExists+'"}', function(response) {
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

					if(d.content.recent) count_cflags[0]++;
					if(d.content.upcoming) count_cflags[1]++;
					if(d.content.stressful) count_cflags[2]++;
					if(d.content.surreal) count_cflags[3]++;
					if(d.content.scary) count_cflags[4]++;
					if(d.content.romantic) count_cflags[5]++;
					if(d.content.sexual) count_cflags[6]++;

					h = '<div id="dream" class="drC" data-id="'+ d._id +'">';
					h += '<div id="date">' + formatDate(d.date) + '</div>';
					h += '<div id="title">' + d.title + '</div>';
					h += '<div id="characters">' + 'C (' + d.char_cnt+')' + '</div>';
					h += '<div id="tags">' + 'T ('+d.tag_cnt+')' + '</div>';
					h += '<div id="words">' + 'W ('+d.word_cnt+')' + '</div>';
					h += '<div id="content" '+(d.content.recent?'class="content1" title="Recent event"':'')+'> </div>';
					h += '<div id="content" '+(d.content.upcoming?'class="content1" title="Upcoming event"':'')+'> </div>';
					h += '<div id="content" '+(d.content.stressful?'class="content1" title="Stressful"':'')+'> </div>';
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

				$('#filter #content > div:nth-child(1)').append(" ("+count_cflags[0]+")");
				$('#filter #content > div:nth-child(2)').append(" ("+count_cflags[1]+")");
				$('#filter #content > div:nth-child(3)').append(" ("+count_cflags[2]+")");
				$('#filter #content > div:nth-child(4)').append(" ("+count_cflags[3]+")");
				$('#filter #content > div:nth-child(5)').append(" ("+count_cflags[4]+")");
				$('#filter #content > div:nth-child(6)').append(" ("+count_cflags[5]+")");
				$('#filter #content > div:nth-child(7)').append(" ("+count_cflags[6]+")");

				$('#avg_sentiment #score #sentiment_number').html(all.sentimentTotal.score.toFixed(2));
				$('#avg_sentiment #comparative #sentiment_number').html(all.sentimentTotal.comparative.toFixed(2));
				$('#avg_sentiment #magnitude #sentiment_number').html((all.sentimentTotal.magnitude * 100).toFixed(1)+"%");

				makeTopTags('tags', all.top_tags);
				makeTopTags('characters', all.top_chars);

				$("#tags ul li").live("click", function() {
					var tagName = $(this).text().split(' ')[0];
					window.location = "all?tag=" + tagName;
				});

				$("#characters ul li").live("click", function() {
					var charName = $(this).text().split(' ')[0];
					window.location = "all?character=" + charName;
				});


				$("#edit").live("click", function() {
					var id = $(this).parent().parent().data('id');
					console.log("click EDIT " + id);
					window.location = "one.html?edit=1&id=" + id;
				});
// 
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

				$('#filter-clear').click( function() {
					$('#content_recent').prop('checked', false);
					$('#content_upcoming').prop('checked', false);
					$('#content_stressful').prop('checked', false);
					$('#content_surreal').prop('checked', false);
					$('#content_scary').prop('checked', false);
					$('#content_romantic').prop('checked', false);
					$('#content_sexual').prop('checked', false);
					$('#startDate').val(formatDate(new Date(2003,1,1)));
					$('#endDate').val(formatDate(new Date()));
				})

				$('#filter-submit').click( function() {
					console.log("Filter dreams");
					var content = {
						recent: $('#content_recent').prop('checked'),
						upcoming: $('#content_upcoming').prop('checked'),
						stressful: $('#content_stressful').prop('checked'),
						surreal: $('#content_surreal').prop('checked'),
						scary: $('#content_scary').prop('checked'),
						romantic: $('#content_romantic').prop('checked'),
						sexual: $('#content_sexual').prop('checked')
					};
					newURL = "all.html?";
					if(tag) newURL += "tag="+tag;
					else if (character) newURL += "character="+character;
					else newURL += "none=0";

					var _startD = new Date($('#startDate').val()).toISOString();
					var _endD = new Date($('#endDate').val()).toISOString();
					// console.log("start date: "+_startD);
					// console.log("end date: "+_endD);
					newURL += "&startDate="+encodeURIComponent(_startD);
					newURL += "&endDate="+encodeURIComponent(_endD);
					newURL += "&cf1="+(content.recent?1:0);
					newURL += "&cf2="+(content.upcoming?1:0);
					newURL += "&cf3="+(content.stressful?1:0);
					newURL += "&cf4="+(content.surreal?1:0);
					newURL += "&cf5="+(content.scary?1:0);
					newURL += "&cf6="+(content.romantic?1:0);
					newURL += "&cf7="+(content.sexual?1:0);
					window.location = newURL;
				});


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

	function makeTopTags(id, tags) {
		console.log("makeTopTags: "+JSON.stringify(tags));

		$('#' + id + '.tagcloud ul').html('');
		for(var i=0; i<tags.length; i++) {
			$('#' + id + '.tagcloud ul').append("<li>" + tags[i][0]+ " ("+tags[i][1] + ")</li>");
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