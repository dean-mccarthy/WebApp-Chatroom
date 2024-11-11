// assuming cpen322-tester.js is in the same directory as server.js
const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('./Database.js');
const ws = require('ws');
const { WebSocketServer } = require('ws');
const SessionManager = require('./SessionManager.js');

const broker = new WebSocketServer({ port: 8000 });
const sessionManager = new SessionManager


function logRequest(req, res, next) {
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = '127.0.0.1'; //temp change for tj computer
const port = 3000;
const clientApp = path.join(__dirname, 'client');
const db = Database('mongodb://127.0.0.1', 'cpen322-messenger'); //temp change for tj computer
const messageBlockSize = 10;

var messages = {};

db.getRooms()
	.then(rooms => {
		rooms.forEach(room => {
			messages[room._id] = [];
		});
	})
	.catch(err => {
		console.error("Error initializing messages:", err);
	});


// express app
let app = express();

app.use(express.json()) 						// to parse application/json
app.use(express.urlencoded({ extended: true })) // to parse application/x-www-form-urlencoded
app.use(logRequest);							// logging for debug

// serve static files (client-side)
app.use('/', express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});

app.route('/chat')
	.get((req, res) => {
		db.getRooms()
			.then(rooms => {
				const chats = rooms.map(room => ({
					_id: room._id,
					name: room.name,
					image: room.image,
					messages: messages[room._id]
				}));
				res.json(chats);
			});

	});

app.route('/login')
	.get((req, res) => {
		
	});

app.route('/login')
	.post((req, res) => {
		const data = req.body //??
		console.log("***IN LOGIN:POST***")
		console.log(data)
		const user = {
			username: data.username,
			password: data.password,
		}
		res.status(200).json(user); 

	});



app.route('/chat')
	.post((req, res) => {
		const data = req.body
		if (!data.name) {
			res.status(400).json({ message: "Error: Room has no name", data });
		}
		else {

			//Check if this is necessary!
			var genId = generateUniqueId(data.name);
			messages[genId] = [];

			const newRoom = {
				_id: genId,
				name: data.name,
				image: data.image,
				messages: messages[genId]
			}

			db.addRoom(newRoom)
			res.status(200).json(newRoom);
		}
	})

app.route('/chat/:room_id')
	.get((req, res) => {
		const roomId = req.params.room_id;
		db.getRoom(roomId)
			.then(room => {
				if (room) {
					res.json(room);
				} else {
					res.status(404).json({ error: 'Room ${roomId} was not found' });
				}
			})
			.catch(err => {
				console.error("Error fetching room:", err);
				res.status(500).json({ error: "An error occurred while retrieving the room" });
			});
	})

app.route('/chat/:room_id/messages')
	.get((req, res) => {
		const roomId = req.params.room_id;
		const before = parseInt(req.query.before, 10);
		//console.log("roomId: ", roomId, " before: ", before)

		db.getLastConversation(roomId, before)
			.then(conversation => {
				// console.log("in server.js")
				if (conversation) {
					res.json(conversation);
				} else {
					//console.log(conversation)
					res.status(404).json({ error: `conversation ${roomId}, ${before} was not found` });
				}
			})
			.catch(err => {
				console.error("Error fetching conversation:", err);
				res.status(500).json({ error: "An error occurred while retrieving the conversation" });
			});
	})

function generateUniqueId(roomName) {
	const currTime = Date.now().toString();
	const id = 'room-' + roomName + '-' + currTime;
	return id;
}

broker.on('connection', (socket) => {
	console.log('New client connected');
	socket.on('message', (data) => {
		// console.log('Message received from a client:', data);
		const messageData = JSON.parse(data);
		const user = messageData.username;
		console.log(messageData.username);
		const text = messageData.text;
		const roomId = messageData.roomId;

		if (messages[roomId]) {
			const newMessage = {
				username: user,
				text: text,
			};
			messages[roomId].push(newMessage);
			//a4t3pd
			if ((messages[roomId].length) >= messageBlockSize) {
				console.log("message size: ", messages[roomId].length)
				db.addConversation({ room_id: roomId, timestamp: Date.now(), messages: messages[roomId] })
					.then(result => {
						messages[roomId] = []
						console.log(result)
					})
					.catch(console.log("error adding conversation in broker"))

			}
		}

		broker.clients.forEach(client => {
			if (client !== socket && client.readyState === ws.OPEN) { //for all other open clients
				client.send(JSON.stringify(messageData));
			}
		})
	})
	socket.on('close', () => {
		console.log('A client disconnected.');
	});
})

// at the very end of server.js
cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
cpen322.export(__filename, {
	app,
	messages,
	broker,
	db,
	messageBlockSize,
	sessionManager
	// isCorrectPassword
});

