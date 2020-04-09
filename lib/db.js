// ---------------------------------------
// Globals
// ---------------------------------------
var mongoose = require('mongoose');
var util = require('util');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

exports.initialize = function(port, config, cb, ecb) {
	
	mongoose.connection.on('open', isConnected);

	function isConnected() {
		util.log("Connected to MongoDB "+dbURL);
		cb();						// success callback at server
	};

	var c = config;
	var dbURL = "mongodb://" + c.username + ":" + c.password + "@" + c.url + "/" + c.database;
	// var dbURL = 'mongodb://localhost/db';

	// IF YOU WANT TO CONNECT TO A LOCAL MONGO DATABASE
	// if(port == 8010) dbURL = 'mongodb://localhost/dlog';

	// initiate connection to database
	mongoose.connect(dbURL, function(err) {
		if(err) {
			util.log("MongoDB connection error: "+err.message);
			ecb();					// error callback at server
		}
	});


	function getDate (dt) {
		// util.log("getDate() "+dt);
		// var date = new Date(dt);
		var d = dt.getDate();
		var m = dt.getMonth()+1;
		var y = dt.getFullYear();
		util.log( d + '|' + m + '|' + y );
		return d + '|' + m + '|' + y;
		// return dt.valueOf();
	}

	function getStart (t) {
		if(t && t != '') return t;
		else return '...';
	}


	// ------------- Schemes -------------

	var DreamSchema = new Schema({
		// _id			: ObjectId,			// declared automatically by mongoDB
											// if declared here, will NOT save back
		dream 			: { type: String },
		title			: { type: String },
		start 			: { type: String, get: getStart },
		date 			: { type: Date, default: Date.now },	// get: getDate, 
		sleep			: {
				type		: String,
				begin		: Number,
				duration	: Number
		},
		diary			: String,
		interpretation	: String,
		// classification	: {
		// 		lucid		: Boolean,
		// 		realistic	: { type: Number, min: 0, max: 10 },
		// 		positive	: { type: Number, min: 0, max: 10 },
		// 		erotic		: { type: Number, min: 0, max: 10 }
		// },
		characters		: [CharacterRefSchema],
		tags			: [TagRefSchema],
		sleep_type		: String,
		dream_type		: String
	});

	DreamSchema
		.virtual('shortdate')
		.get(function () {
			util.log("shortdate: "+this.date);
			var date = new Date(this.date);
			var d = date.getDate();
			var m = date.getMonth()+1;
			var y = date.getFullYear();
			return m + '/' + d + '/' + y;
		});

	var CharacterSchema = new Schema({
		name 			: String,
		description		: String,
		dreams 			: [DreamRefSchema]
	})

	var TagSchema = new Schema({
		name 			: String,
		description		: String,
		dreams 			: [DreamRefSchema]
	})

	var TagRefSchema = new Schema( {
		tagId 			: ObjectId,
		name 			: String
	})

	var CharacterRefSchema = new Schema( {
		tagId 			: ObjectId,
		name 			: String
	})

	var DreamRefSchema = new Schema( {
		dreamId 		: ObjectId
	})

	return {
		
		Dream: mongoose.model('dream', DreamSchema),
		Character: mongoose.model('character', CharacterSchema),
		Tag: mongoose.model('tag', CharacterSchema)
		
	}

}