// assuming cpen322-tester.js is in the same directory as server.js
const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('./Database.js');
const ws = require('ws');
const { WebSocketServer } = require('ws');
const SessionManager = require('./SessionManager.js');
const crypto = require('crypto');


const broker = new WebSocketServer({ port: 8000 });
const sessionManager = new SessionManager
const SessionError = SessionManager.Error; 

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

app.route('/profile')
	.get(sessionManager.middleware, (req, res) => {
		if (req.username) {
			res.status(200).send({username: req.username });
		} else {
			res.redirect('/login');
		}
	})

// serve static files (client-side)
app.use(['/app.js',],sessionManager.middleware,express.static(clientApp + '/app.js'));
app.use(['/index','/index.html',/^\/$/i],sessionManager.middleware,express.static(clientApp + '/index.html'))
app.use('/',express.static(clientApp, { extensions: ['html'] }));
app.listen(port, () => {
	console.log(`${new Date()}  App Started. Listening on ${host}:${port}, serving ${clientApp}`);
});


app.use((err, req, res, next) => { //CHATGPT MY BELOVED
	if (err instanceof SessionManager.Error) {
  
	  if (req.headers.accept === 'application/json') {
		return res.status(401).json({ error: err.message });
	  } else {
		return res.redirect('/login');
	  }
	}
	return res.status(500).json({ error: 'Something went wrong on the server.'});
  });

app.route('/chat')
	.get(sessionManager.middleware, (req, res) => {
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
	.post((req, res) => {
		//rename confusing variables
		console.log("***IN LOGIN:POST***")
		const data = req.body 
		console.log(data)
		const user = {
			username: data.username,
			password: data.password,
		}
		console.log("user: ", user)
		//attempt to find user
		db.getUser(user.username)
			.then(userResult => {
				if (userResult) {
					console.log("userResult: ")
					console.log(userResult)
					console.log("user found, checking password")
					if (isCorrectPassword(user.password, userResult.password)){
						console.log("Password is correct, create a new session")
						sessionManager.createSession(res, user.username); 
						return res.redirect('/');
						
					} else {
						console.log("incorrect password")
						return res.redirect('/login');
					}

				} else {
					console.log("no user found, redirecting to /login")
					return res.redirect('/login');
				}

			})
			.catch(err => {
				console.log("caught error after getUser: ", err)
				return res.status(500).json({ error: "An error occurred while fetching user" });
			})



	});



app.route('/chat')
	.post(sessionManager.middleware, (req, res) => {
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
	.get(sessionManager.middleware,(req, res) => {
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
	.get(sessionManager.middleware, (req, res) => {
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

app.route('/logout').get(async function(req, res){
		sessionManager.deleteSession(req);
		res.redirect("/login")
	})



function generateUniqueId(roomName) {
	const currTime = Date.now().toString();
	const id = 'room-' + roomName + '-' + currTime;
	return id;
}

function isCorrectPassword(password, saltedHash) {
	console.log("isCorrectPassword with password: ", password, "; saltedHash: ", saltedHash);
	//retrieve salt -> concat password and salt -> convert to base64 using SHA-256 -> compare to saltedHash
	const salt = saltedHash.toString().slice(0, 20); //first 20 chars are salt
	const saltedPassword = password + salt; //concat password and salt
	const hashedSaltedPassword = crypto.createHash('SHA256').update(saltedPassword).digest('base64');

	const actualHash = saltedHash.slice(20)

	console.log("\npassword: ", password, "\nsaltedHash: ", saltedHash, "\nsalt: ", salt, 
		"\nsaltedPassword: ", saltedPassword, "\nhashSaltedPassword: ", hashedSaltedPassword,
		"\nactualHash: ", actualHash)
	
	return hashedSaltedPassword === actualHash;
}


broker.on('connection', (socket, request) => {
	var cookie = request.headers['cookie'];
	if (!cookie) { // kill if no cookie
		socket.close();
		return;
	}
	const cookieValue = cookie.split('=')[1].trim();
	const cookieUsername = sessionManager.getUsername(cookieValue);
	if (!cookieUsername) {
		socket.close()
	}


	console.log('New client connected');
	socket.on('message', async data => {
		// console.log('Message received from a client:', data);
		const messageData = JSON.parse(data);
		console.log('cookie user: ' + cookieUsername);
		const text = sanitize(messageData.text);
		const roomId = messageData.roomId;

		if (messages[roomId]) {
			
			const newMessage = {
				username: cookieUsername,
				text: text,
			};
			messages[roomId].push(newMessage);
			console.log(newMessage);
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
				messageData.username = cookieUsername;
				client.send(JSON.stringify(messageData));
			}
		})
	})
	socket.on('close', () => {
		console.log('A client disconnected.');
	});
})

function sanitize(text) {
	return text.replace(/<script[^>]*>[\s\S]*?<\/script>|on\w+="[^"]*"|<img[^>]*>/gi, '') // remove script tags
	.replace(/<script[^>]*>[\s\S]*?<\/script>|on\w+="[^"]*"|<img[^>]*>/gi, match => { //keep insides
		const allowedTags = ['b', 'i', 'code', 'pre', 'strong', 'em']; // allow formatting tags
		const tagName = match.match(/<\/?([a-zA-Z]+)/);
		if (tagName && allowedTags.includes(tagName[1])) {
			return match;  // return allowed tag
		}
		return '';  // strip disallowed tags
	});
  }


// at the very end of server.js
cpen322.connect('http://3.98.223.41/cpen322/test-a5-server.js');
//cpen322.connect('client/tests/test-a5-server.js');
cpen322.export(__filename, {
	app,
	messages,
	broker,
	db,
	messageBlockSize,
	sessionManager,
	isCorrectPassword
});

