const { query } = require('express');
const { MongoClient, ObjectId } = require('mongodb');	// require the mongodb driver

/**
 * Uses mongodb v6.3 - [API Documentation](http://mongodb.github.io/node-mongodb-native/6.3/)
 * Database wraps a mongoDB connection to provide a higher-level abstraction layer
 * for manipulating the objects in our cpen322 app.
 */
function Database(mongoUrl, dbName){
	if (!(this instanceof Database)) return new Database(mongoUrl, dbName);
	this.connected = new Promise((resolve, reject) => {
		const client = new MongoClient(mongoUrl);

		client.connect()
		.then(() => {
			console.log('[MongoClient] Connected to ' + mongoUrl + '/' + dbName);
			resolve(client.db(dbName));
		}, reject);
	});
	this.status = () => this.connected.then(
		db => ({ error: null, url: mongoUrl, db: dbName }),
		err => ({ error: err })
	);
}

Database.prototype.getRooms = function(){ //chatGPT structure
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read the chatrooms from `db`
			 * and resolve an array of chatrooms */
			console.log("Finding rooms");
			resolve(db.collection('chatrooms') //search chatrooms
				.find() //find all
				.toArray()); //else resolve with rooms array
				})
		)
}


Database.prototype.getRoom = function(room_id){ //chatGPT structure
	return this.connected.then(db =>
		new Promise((resolve, reject) => {

			console.log("searching for room with roomid: ", room_id)
			let id = room_id

			try{
				//can only cast if room_id is a hexadecimal or integer				
				console.log("attempting to cast room_id to ObjectID")
				id = new ObjectId(room_id)	//TODO: fix deprecation
			}
			catch (error) {
				console.log("cannot cast to ObjectID: ", error.message)
			}

			let query = {_id: id};

			console.log("query: ", query, " with id of type ", typeof(id), ": ", id)

			db.collection('chatrooms')
				.findOne(query)
				.then(room => resolve (room))
				.catch(err => reject(err)) 
		})
	)
}


Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			console.log('ADDING ROOM')
            if (!room.name) {
                return reject(new Error("Room name required"));
            }
			console.log("addRoom room:" );
			console.log(room);


            db.collection('chatrooms').insertOne(room)
                .then(result => {
                    // Retrieve the inserted room object including the assigned _id
                    var insertedRoom = {_id: result._id, ...room};
					if (room._id) {
						insertedRoom = {_id: room._id, ...room};
					}
                    console.log("addRoom insertRoom:" )
					console.log(insertedRoom)
					resolve(insertedRoom); // Resolve with the new room object
                })
                .catch(err => reject(err)); // Reject on error
        })
	)
}

Database.prototype.getLastConversation = function(room_id, before){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: read a conversation from `db` based on the given arguments
			 * and resolve if found */
		})
	)
}

Database.prototype.addConversation = function(conversation){
	return this.connected.then(db =>
		new Promise((resolve, reject) => {
			/* TODO: insert a conversation in the "conversations" collection in `db`
			 * and resolve the newly added conversation */
		})
	)
}

module.exports = Database;
