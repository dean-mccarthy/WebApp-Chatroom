// assuming cpen322-tester.js is in the same directory as server.js
const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('./Database.js');
const ws = require('ws');
const { WebSocketServer } = require('ws');

const broker = new WebSocketServer({port: 8000});



function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');
const db = Database('mongodb://localhost:27017', 'cpen322-messenger');

var chatrooms = [ //A3 T2A
	{
		id: 'room-1',
		name: "Gaming",
		image: 'assets/minecraft.jpg'
	},
	{
		id: 'room-2',
		name: "Class",
		image: 'assets/everyone-icon.png'
	},
]

var messages = {};

chatrooms.forEach(currRoom => { //A3 T2B
	messages[currRoom.id] = [];
})

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
	.get((req,res) => {
		const chats = chatrooms.map(room => ({
			id: room.id,
			name: room.name,
			image: room.image,
			messages: messages[room.id]
		}));
		res.json(chats);
	});

app.route('/chat')	
	.post((req,res) => {
		const data = req.body
		if(!data.name){
			res.status(400).json({message: "Error: Room has no name", data});
		}
		else{
			
			//Check if this is necessary!
			var genId = generateUniqueId(data.name);
			messages[genId] = [];
			
			const newRoom =  {
				id: genId,
				name: data.name,
				image: data.image,
				messages: messages[genId]
			}
			
			chatrooms.push(newRoom);
			res.status(200).json(newRoom);
		}
	})
	
function generateUniqueId(roomName) {
	const currTime = Date.now().toString();
	const id = 'room-' + roomName + '-' + currTime; 
	return id;
}

broker.on('connection', (socket) => {
	console.log('New client connected');
	socket.on('message', (data) => {
		console.log('Message received from a client:', data);
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
cpen322.connect('http://3.98.223.41/cpen322/test-a3-server.js');
cpen322.export(__filename, { 
	app,
	messages,
	chatrooms,
	broker
 });

