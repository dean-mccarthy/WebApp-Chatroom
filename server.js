// assuming cpen322-tester.js is in the same directory as server.js
const cpen322 = require('./cpen322-tester.js');
const path = require('path');
const fs = require('fs');
const express = require('express');

function logRequest(req, res, next){
	console.log(`${new Date()}  ${req.ip} : ${req.method} ${req.path}`);
	next();
}

const host = 'localhost';
const port = 3000;
const clientApp = path.join(__dirname, 'client');

var chatrooms = [ //A3 T2A
	{
		id: 'room-1',
		name: "Gaming",
		image: 'client/assets/minecraft.jpg'
	},
	{
		id: 'room-2',
		name: "Class",
		image: 'client/assets/everyone-icon.jpg'
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
	

// at the very end of server.js
cpen322.connect('http://3.98.223.41/cpen322/test-a3-server.js');
cpen322.export(__filename, { 
	app,
	messages,
	chatrooms,
 });