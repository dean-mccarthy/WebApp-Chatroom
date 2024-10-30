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
			/* TODO: read the chatroom from `db`
			 * and resolve the result */
			let query = {_id: room_id};

			if (!(room_id instanceof ObjectId)) {
				query = {_id: room_id}; // if fail then give query as string
			}

			db.collection('chatrooms')
				.findOne(query, (err, room) => {
					if(err) {
						return reject(err);
					}
					resolve (room || null); // resolve null if not found
				})
		})
	)
}

Database.prototype.addRoom = function(room){
	return this.connected.then(db => 
		new Promise((resolve, reject) => {
			/* TODO: insert a room in the "chatrooms" collection in `db`
			 * and resolve the newly added room */
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
