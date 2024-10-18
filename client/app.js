//task 8a
var profile = {
  username: "Guest"
};


// Overall Views

class LobbyView {
  constructor(lobby) { // TODO: Change <a> to be the whole box after we get assn1 evalutated
    this.lobby = lobby;
    this.elem = createDOM(`
			<div class="content">
				<ul class="room-list">
					<li>
						<a href="#/chat"><img src="assets/everyone-icon.png"/>Everyone in CPEN320</a>
					</li>
					<li>
						<a href="#/chat"><img src="assets/bibimbap.jpg"/>SCRANNNN</a>
					</li>
					<li>
						<a href="#/chat"><img src="assets/minecraft.jpg"/>Fortnite Battle Royale</a>
					</li>
					<li>
						<a href="#/chat"><img src="assets/canucks.png"/>No wins</a>
					</li>
				</ul>
				<div class="page-control">
					<input type="text" placeholder="Room Name"></input> <button type="button">Create new room</button>
				</div>
			</div>
		`);
    this.listElem = this.elem.querySelector('ul.room-list');
    this.inputElem = this.elem.querySelector('input');
    this.buttonElem = this.elem.querySelector('button');

    this.lobby.onNewRoom = (room) => {
      const roomItem = createDOM(`<li><a href="#/chat/${room.id}"><img src="${room.image}"/>${room.name}</a></li>`);
      this.listElem.appendChild(roomItem);
    }

    this.redrawList(); //draw initial room list



    this.buttonElem.addEventListener('click', () => {

      const roomName = this.inputElem.value.trim();
      const roomImg = "assets/everyone-icon.png" //is this redundant?
      console.log("button clicked");
      if (roomName !== '') {

        console.log("room name:", roomName);

        const data = {
          name: roomName,
          image: roomImg
        }


        Service.addRoom(data)
          .then(response => {
            console.log('Room added', response);
            this.lobby.addRoom(response.id, response.name);
            this.inputElem.value = '';
          })
          .catch(err => {
            console.log('Failed to addRoom', err);
          });

      }
    });

  }
  redrawList() {
    emptyDOM(this.listElem);
    for (var roomId in this.lobby.rooms) {
      var currRoom = this.lobby.rooms[roomId];
      const roomItem = createDOM(`<li><a href="#/chat/${roomId}"><img src="${currRoom.image}"/>${currRoom.name}</a></li>`);
      this.listElem.appendChild(roomItem);
    }
  }
}

class ChatView {
  constructor() {
    this.elem = createDOM(`
			<div class="content">
				<h4 class="room-name">Room Name</h4>
				<div class="message-list">
					<div class="message">
						<span class="message-user">User</span>
						<span class="message-text">Message</span>
					</div>
					<div class="message my-message">
						<span class="message-user">Me</span>
						<span class="message-text">Message</span>
					</div>

				</div>
				<div class="page-control">
					<textarea type="textarea" placeholder="Type your message here"></textarea> <button type="button">Send</button>
				</div>
			</div>
			`);
    this.titleElem = this.elem.querySelector('h4.room-name');
    this.chatElem = this.elem.querySelector('div.message-list');
    this.inputElem = this.elem.querySelector('textarea');
    this.buttonElem = this.elem.querySelector('button');

    //task 8d
    this.room = null;
    this.buttonElem.addEventListener('click', () => this.sendMessage());
    this.inputElem.addEventListener('keyup', (event) => {
      if (event.key == 'Enter' && !event.shiftKey) {
        this.sendMessage();
      }
    });
  }

  // //task 8c
  sendMessage() {
    console.log("button clicked");
    const text = this.inputElem.value;
    //console.log(text);
    if (text !== '') {
      this.room.addMessage(profile.username, text);
      // this.inputElem.value = ''; //i think it should be this but it breaks the tests
      this.inputElem.value = '';
    }

  }

  setRoom(room) {
    this.room = room;
    this.titleElem.innerHTML = room.name;

    this.redrawMessageList();

    //sudo new event listener
    this.room.onNewMessage = (message) => {
      this.makeMessage(message)
    };

  }

  redrawMessageList() {
    emptyDOM(this.chatElem);
    for (var message in this.room.messages) {
      var currMessage = this.room.messages[message];
      this.makeMessage(currMessage);
    }
  }



  makeMessage(message) {

    if (message.username == profile.username) {
      console.log('making my-mess');
      const messageItem = createDOM(`
        <div class="message my-message">
          <span class="message-user">${message.username}</span>
          <span class="message-text">${message.text}</span>
        </div>
      `);
      this.chatElem.appendChild(messageItem);
    } else {
      console.log('making other-mess');
      const messageItem = createDOM(`
        <div class="message">
          <span class="message-user">${message.username}</span>
          <span class="message-text">${message.text}</span>
        </div>
      `);
      this.chatElem.appendChild(messageItem);
    }
  }
}


class ProfileView {
  constructor() {
    this.elem = createDOM(`
		<div class="content">
			<div class="profile-form">
				<div class="form-field">
					<label>Username: </label><input type="text" style="margin-left: 17px;""></input>
				</div>
				<div class="form-field">
					<label>Password: </label><input type="password" style="margin-left: 20px;"></input>
				</div>
				<div class="form-field">
					<label>Avatar: </label><input type="file"></input>
				</div>
			</div>
			<div class="page-control">
				<button type="button">Save Changes</button>
			</div>
		</div>
		`);
  }
}

// Additional Classes

class Room {
  constructor(id, name, image = "assets/everyone-icon.png", messages = []) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
  };

  addMessage(username, text) {
    console.log("text:");
    console.log(text);
    //no type check on text, converts to string before trimming
    if (text == "" || String(text).trim().length == 0) //if text is empty or only whitespaces
      return;
    else {
      const message = {
        username: username,
        text: text,
      };
      this.messages.push(message);

      //task 8b
      //check if onNewMessage function is defined 
      if (typeof this.onNewMessage === 'function') {
        this.onNewMessage(message);
      }

    }
  }
}

class Lobby {
  constructor() {
    this.rooms = {};
  };

  getRoom(roomId) {
    if (this.rooms[roomId]) {
      return this.rooms[roomId];
    }
    else
      return null;
  }

  addRoom(id, name, image = "assets/everyone-icon.png", messages = []) {
    if (this.getRoom(id)) {
      console.log("Could not create room: Room with this ID already exists");
    }
    else {
      const newRoom = new Room(id, name, image, messages);
      this.rooms[id] = newRoom;
      if (typeof this.onNewRoom === 'function') {
        this.onNewRoom(newRoom);
      }
    }


  }
}

var Service = { //Task 1A 
  origin: window.location.origin, //T 1B 

  getAllRooms: function () { //T 1C, structure from ChatGPT
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", Service.origin + "/chat");
      xhr.onload = () => {
        if (xhr.status === 200) {
          console.log(xhr.status);
          resolve(JSON.parse(xhr.response));
        } else {
          reject(new Error(xhr.responseText));
        }
      }
      xhr.onerror = () => reject(new Error(xhr.responseText));
      xhr.send();
    })
  },

  addRoom: function (data) {
    return new Promise((resolve, reject) => {
      let JSONdata = JSON.stringify(data); //Task 3.A

      var xhr = new XMLHttpRequest();
      xhr.open("POST", Service.origin + "/chat");
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onload = () => {
        console.log("xhr response:")
        console.log(xhr.response)
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject(new Error(xhr.responseText));
        }
      }
      xhr.onerror = () => reject(new Error(xhr.responseText));
      xhr.send(JSONdata);
    }
    )
  }
}

// Helper Functions

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM(elem) {
  while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM(htmlString) {
  // console.log("createDOM");
  //console.log(htmlString);
  let template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  //console.log(template.content.firstChild);
  return template.content.firstChild;
}

function main() {

  const lobby = new Lobby();


  console.log("page is fully loaded");
  const lobbyView = new LobbyView(lobby);
  const chatView = new ChatView();
  const profileView = new ProfileView();

  const socket = new WebSocket("ws://localhost:3000")

  renderRoute();
  refreshLobby();

  function renderRoute() {

    const path = window.location.hash.substring(2);
    const url = path.split('/')[0];
    const roomId = path.split('/')[1];
    const pageView = document.getElementById('page-view');

    if (url == "") {
      //console.log(indexContent);
      emptyDOM(pageView);
      pageView.appendChild(lobbyView.elem);

    }

    else if (url == "profile") {
      console.log("profileContent");
      //console.log(profileContent);
      emptyDOM(pageView);
      pageView.appendChild(profileView.elem);

    }

    else if (url == "chat") {
      const room = lobby.getRoom(roomId)

      if (room) {
        console.log("chatContent");
        emptyDOM(pageView);
        pageView.appendChild(chatView.elem);
        chatView.setRoom(room);
      }
    }
  }

  function refreshLobby() {
    Service.getAllRooms()
      .then(roomsArray => {
        for (var i = 0; i < roomsArray.length; i++) {
          let currRoom = roomsArray[i];
          if (lobby.rooms[currRoom.id] !== undefined) {
            lobby.rooms[currRoom.id].name = currRoom.name;
            lobby.rooms[currRoom.id].image = currRoom.image;
          } else {
            lobby.addRoom(currRoom.id, currRoom.name, currRoom.image, currRoom.messages);
          }
        }
      });
  }

  socket.addEventListener("message", (event) => {
    console.log("pre parse", event);

    messageData = JSON.parse(event.data);
    console.log("post parse", messageData);
    const roomId = messageData.roomId;

    const room = lobby.getRoom(roomId);
    room.addMessage(messageData.username, messageData.text);

  });




  setInterval(refreshLobby, 5000);
  window.addEventListener('popstate', renderRoute);
  window.addEventListener('hashchange', renderRoute);

  cpen322.export(arguments.callee, {
    renderRoute: renderRoute,
    lobbyView: lobbyView,
    chatView: chatView,
    profileView: profileView,
    lobby: lobby,
    refreshLobby: refreshLobby,
    socket: socket
  });
}


window.addEventListener('load', main);
