
// --------------------------
// dlog 2011
// --------------------------

(function($){

	url = window.location.host || 'evsc.no.de';
	console.log("url: "+url);
	url = 'http://'+ url;
	var pass;
	// url = "http://localhost:8010";


	start = function( space ) {

		// check cookie to see if password has been set already
		pass = getCookie('dlogcookie');
		if(pass === null) { 
			pass = prompt("Moderation Password","");
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
				$('#title').val('New Dream Title');
				$('#submit').text('Submit Dream');
				$("#data").data('tags', []);
				$("#data").data('characters', []);
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

			$("#typesleep_night").live("click", function() {
				var sleepName = $(this).value();
				alert(sleepName);
				window.location = "all?sleep=" + sleepName;
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
			if(tag) $('h1').append(" / tag: "+tag);
			if(character) $('h1').append(" / character: "+character);

			var firstMonth = new Date(2010,1,1);
			firstMonth.setDate(1);
			var lastMonth = new Date(Date.now());
			lastMonth.setDate(1);
			var tag_by_month = new Array(); 
			var m = 0;
			for ( var dd = firstMonth; dd <= lastMonth; dd.setMonth(dd.getMonth() + 1)) {
				tag_by_month[m] = {date: dd.getFullYear() +'/'+dd.getMonth(), count: 0 };
				m++;
			};
			var months = m;

			// load all dreams into page
			$.post(url, '{ "req" : "all", "tag" : "'+tag+'", "character" : "'+character+'", "pass" : "'+pass+'" }', function(response) {
				var all = JSON.parse(response);
				// console.log('all response '+all);

				var h = '';
				var b = ''
				all.allDreams.forEach( function(d) {
					// 
					var dreamDate = new Date(d.date);
					var dreamMonth = dreamDate.getFullYear() +'/'+dreamDate.getMonth();

					for (var i=0; i<tag_by_month.length; i++) {
						if (tag_by_month[i].date == dreamMonth) {
							tag_by_month[i].count += 1;
							break;
						}
					}

					h = '<div id="dream" class="drC" data-id="'+ d._id +'">';
					h += '<div id="date">' + formatDate(d.date) + '</div>';
					h += '<div id="title">' + d.title + '</div>';
					h += '<div id="characters">' + 'characters (' + d.char_cnt+')' + '</div>';
					h += '<div id="tags">' + 'tags ('+d.tag_cnt+')' + '</div>';
					h += '<div id="words">' + 'words ('+d.word_cnt+')' + '</div>';
					h += '<div id="buttons">';
					h += '<div id="edit">edit</div>';
					h += '<div id="delete">x</div>';
					h += '</div>';
					h += '</div>';
					$(h).appendTo('#archive');
				});
				//.ready( function() { console.log("ready"); });

				$("#edit").live("click", function() {
					var id = $(this).parent().parent().data('id');
					console.log("click EDIT " + id);
					window.location = "one.html?edit=1&id=" + id;
				});

				$("#delete").live("click", function() {
					console.log("delete dream " + $(this).parent().parent().data('id'));
					deleteDream($(this).parent().parent().data('id'), $(this).parent().parent(), function(obj) {
						$(obj).remove();
					});
				})

				$("#title").live("click", function() {
					var id = $(this).parent().data('id');
					console.log("click TITLE " + id);
					window.location = "one.html?id=" + id;
				})

				if (tag != false || character != false) {

			        var chartData = [];
			        for (var i=0; i<tag_by_month.length; i++) { // tag_by_month.length
			        	chartData[i] = [tag_by_month[i].date, tag_by_month[i].count];
			        };

			        drawChart(tag, chartData);
				}

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
			$('#data').addClass('noEdit');
			$('input:radio[name=typesleep]').attr('disabled',true);
			$('input:radio[name=typedream]').attr('disabled',true);
			$('input, textarea').attr("readonly", "readonly");
			console.log("enabled");
		} else {
			$("#dream #echoer").addClass('hide');
			$('#data').removeClass('noEdit');
			$('input:radio[name=typesleep]').attr('disabled',false);
			$('input:radio[name=typedream]').attr('disabled',false);
			$('input, textarea').removeAttr("readonly");
			$('#submit').attr("disabled", "disabled");
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
		var tags =  dream.tags;
		var characters = dream.characters;
		makeTags('tags', tags);
		makeTags('characters', characters);
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

	function makeTags(id, tags) {
		console.log("makeTags: "+JSON.stringify(tags));
		$("#data").data(id, []);

		$('#' + id + '.taglist ul').html('');
		for(var i=0; i<tags.length; i++) {
			addTag(id, tags[i].name);
		}

	}

	function addTag(id, t) {
		// check if Tag is already in the list
		// console.log("addTag '" + t + "' to " + id);
		var array = $("#data").data(id);
		if(array) {
			for(var i=0; i<array.length; i++) {
				if(array[i].value == t) {
					return;
				}
			}
		}
		
		t = t;
		array.push( { "value" : t } );
		$("#data").data(id, array);
		// console.log("array pushed " +t + " / " + JSON.stringify(array));
		
		$('#' + id + '.taglist ul').append("<li>" + t + "</li>");
	}

	function deleteTag(id, t) {
		console.log(id + " delete "+ t);
		$('#' + id + '.taglist ul li').each( function () {
			if( $(this).text() == t) $(this).remove();
			// console.log("cycle "+ $(this).text());
		});
	}

	function cleanTags(id) {
		var array = $("#data").data(id);	// { "value" : t }
		// console.log(id +"-array: "+array);
		if(array) {
			var i = array.length;
			while(i--) {
				var tagname = array[i].value;
				// console.log("look for #" + tagname);
				
				var lookfor = (id === 'tags') ? '#' : '@';
				lookfor += array[i].value;
				var compText = $("#dream textarea").val();
				var results = new RegExp(lookfor).test(compText);
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
		var tags = $('#data').data('tags');
		var characters = $('#data').data('characters');
		var sleep_type = $('input:radio[name=typesleep]:checked').val();
		var dream_type = $('input:radio[name=typedream]:checked').val();

		var dreamData = { req : handle, data : {
			"dream" : dream,
			"diary" : diary,
			"title" : title,
			"interpretation" : interpretation,
			"date" : date,
			"id" : id,
			"tags" : tags,
			"characters" : characters,
			"sleep_type" : sleep_type,
			"dream_type" : dream_type
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