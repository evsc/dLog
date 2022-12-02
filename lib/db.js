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

	var dbURL = c.url + c.database;

	mongoose.connect(dbURL, {
		"user": c.username,
		"pass": c.password
	}, function(err) {
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

	var TagRefSchema = new Schema();
	TagRefSchema.add({
		tagId 			: ObjectId,
		name 			: String
	});

	var CharacterRefSchema = new Schema();
	CharacterRefSchema.add( {
		tagId 			: ObjectId,
		name 			: String
	});

	// var CategoryRefSchema = new Schema();
	// CategoryRefSchema.add( {
	// 	tagId 			: ObjectId,
	// 	name 			: String,
	// 	confidence		: Number
	// });

	// var EntityRefSchema = new Schema();
	// EntityRefSchema.add( {
	// 	tagId 			: ObjectId,
	// 	name 			: String,
	// 	type 			: String,
	// 	salience 		: { type: Number, min: 0.0, max: 1.0, default: 0.0 },
	// 	sentiment		: { 
	// 		score	: { type: Number, min: -1.0, max: 1.0, default: 0.0 },
	// 		magnitude	: { type: Number, min: 0.0, default: 0.0 }
	// 	}
	// });

	var DreamRefSchema = new Schema();
	DreamRefSchema.add({
		dreamId 		: ObjectId
	});

	var DreamSchema = new Schema();
	DreamSchema.add({
		// _id			: ObjectId,			// declared automatically by mongoDB
											// if declared here, will NOT save back
		dream 			: { type: String },
		title			: { type: String },
		start 			: { type: String, get: getStart },
		date 			: { type: Date, default: Date.now },	// get: getDate, 
		// sleep			: {
		// 		type		: String,
		// 		begin		: Number,
		// 		duration	: Number
		// },
		diary			: String,
		interpretation	: String,
		// classification	: {
		// 		lucid		: Boolean,
		// 		realistic	: { type: Number, min: 0, max: 10 },
		// 		positive	: { type: Number, min: 0, max: 10 },
		// 		erotic		: { type: Number, min: 0, max: 10 }
		// },
		tags			: [TagRefSchema],
		characters		: [CharacterRefSchema],
		// categories		: [CategoryRefSchema],		// Sentiment Analysis
		// entities		: [EntityRefSchema],
		sentiment		: { 
			score	: { type: Number, min: -1.0, max: 1.0, default: 0.0 },
			magnitude	: { type: Number, min: 0.0, default: 0.0 }
		},
		sleep_type		: String,
		dream_type		: String
	});

	var TagSchema = new Schema();
	TagSchema.add({
		name 			: String,
		description		: String,
		dreams 			: [DreamRefSchema]
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

	var CharacterSchema = new Schema();
	CharacterSchema.add({
		name 			: String,
		description		: String,
		dreams 			: [DreamRefSchema]
	});

	// var CategorySchema = new Schema();
	// CategorySchema.add({
	// 	name 			: String,
	// 	description		: String,
	// 	dreams 			: [DreamRefSchema]
	// });

	// var EntitySchema = new Schema();
	// EntitySchema.add({
	// 	name 			: String,
	// 	type 			: String,
	// 	dreams 			: [DreamRefSchema]
	// });

	return {
		
		Dream: mongoose.model('dream', DreamSchema),
		Character: mongoose.model('character', CharacterSchema),
		Tag: mongoose.model('tag', CharacterSchema)
		// Category: mongoose.model('category', CharacterSchema),
		// Entity: mongoose.model('entity', EntitySchema)
		
	}

}