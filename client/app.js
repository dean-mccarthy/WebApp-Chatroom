
function* makeConversationLoader(room) {
  let lastTime = room.startTime;
  let loop = true;

  while (loop) {
    room.canLoadConversation = false;
    yield new Promise((resolve, reject) => {
      Service.getLastConversation(room.id, lastTime)
        .then(lastConvo => {
          if (lastConvo) {
            lastTime = lastConvo.timestamp;
            room.canLoadConversation = true;
            room.addConversation(lastConvo);
            resolve(lastConvo);
          }
          else {
            resolve(null);
            loop = false;
          }
        })
        .catch(err => {
          reject(err);
          loop = false;
        })
    })

  }
}

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
						<a href="#/chat"><img src="assets/grass.png"/>G in Grass if for Great</a>
					</li>
					<li>
						<a href="#/chat"><img src="assets/water.png"/>SCRANNNN</a>
					</li>
					<li>
						<a href="#/chat"><img src="assets/fire.jpg"/>Hot Homies Only</a>
					</li>
					<li>
						<a href="#/chat"><img src="assets/normal.png"/>Normies</a>
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
      const roomImg = "assets/grass.png" //is this redundant?
      if (roomName !== '') {

        console.log("room name:", roomName);

        const data = {
          name: roomName,
          image: roomImg
        }


        Service.addRoom(data)
          .then(response => {
            console.log('Room added', response);
            this.lobby.addRoom(response._id, response.name);
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
  constructor(socket) {
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
          <button id="summary" type="button">Summarize</button>
					<textarea type="textarea" placeholder="Type your message here"></textarea> <button id="send" type="button">Send</button>
				</div>
			</div>
			`);
    this.titleElem = this.elem.querySelector('h4.room-name');
    this.chatElem = this.elem.querySelector('div.message-list');
    this.inputElem = this.elem.querySelector('textarea');
    this.buttonElem = this.elem.querySelector('#send');
    this.summElem = this.elem.querySelector('#summary');
    this.socket = socket;
    console.log("this.socket in ChatView:", this.socket)
    //task 8d
    this.room = null;
    this.buttonElem.addEventListener('click', () => this.sendMessage());
    this.summElem.addEventListener('click', () => this.summarizeConvo());
    this.inputElem.addEventListener('keyup', (event) => {
      if (event.key == 'Enter' && !event.shiftKey) {
        this.sendMessage();
      }
    });
    this.chatElem.addEventListener('wheel', (event) => this.scrollLoad(event));
  }

  //helper function for infinite scroll
  scrollLoad(event) {
    const isTop = this.chatElem.scrollTop <= 0; //Check if dist from top is 0
    const isUp = event.deltaY < 0; //Check if we scrolled up (distance from top decreased)

    if (isTop && isUp && this.room.canLoadConversation) {//check for all 3 conditions
      this.room.getLastConversation.next();

    }

  }

  summarizeConvo() { 
    
    console.log('summarizing');
    console.log(this.room.id);
    //var messages = '[{"username": "Sophia", "text": "I can\'t believe Jason cheated on me... I broke up with him."}, {"username": "Emily", "text": "What?! Are you okay? I\'m so sorry, Soph."}, {"username": "Olivia", "text": "That’s awful. You didn’t deserve that at all. What happened?"}, {"username": "Sophia", "text": "I saw texts from another girl. I just couldn’t stay after that."}, {"username": "Emily", "text": "You’re so strong for walking away. We’re here for you."}, {"username": "Olivia", "text": "Let’s have a girls\' night soon. You need some love and support. ❤️"}]'
    this.room.getLastConversation.next();
    this.room.getLastConversation.next();
    this.room.getLastConversation.next();

    var messages = this.room.messages;

    Service.summarize(messages)
      .then(summary => {
        console.log('Summary:', summary);
        if (summary !== '') {
          this.room.addMessage('Summary:', summary);
    
          //Copied from "sendMessage"
          const message = {
            roomId: this.room.id,
            username: 'Summary:',
            text: summary
          }
          this.socket.send(JSON.stringify(message));
        }
      })
    


  }

  //task 8c
  sendMessage() {
    console.log("button clicked");

    const text = this.inputElem.value;
    if (text !== '') {
      this.room.addMessage(profile.username, text);
      this.inputElem.value = '';

      //task 4d
      const message = {
        roomId: this.room.id,
        text: text
      }
      this.socket.send(JSON.stringify(message));
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

    this.room.onFetchConversation = function (conversation) {

      // var chatElemVariable = document.querySelector('div.message-list')
      //replace after to elimiate reduendancies

      //this.chatElem was undefined, replaced with document.querySelector('div.message-list')
      var preHeight = document.querySelector('div.message-list').scrollTop; //Should be 0 most of the time

      for (let i = conversation.messages.length - 1; i >= 0; i--) {
        let message = conversation.messages[i]
        if (message.username === profile.username) {
          const messageItem = createDOM(`
            <div class="message my-message">
              <span class="message-user">${message.username}</span>
              <span class="message-text">${message.text}</span>
            </div>
          `);
          document.querySelector('div.message-list').prepend(messageItem);
        } else if (message.username === 'Summary:') {
          const messageItem = createDOM(`
            <div class="message summary-mess">
              <span class="message-user">${message.username}</span>
              <span class="message-text">${message.text}</span>
            </div>
          `);
          document.querySelector('div.message-list').prepend(messageItem);
        } else {
          const messageItem = createDOM(`
            <div class="message">
              <span class="message-user">${message.username}</span>
              <span class="message-text">${message.text}</span>
            </div>
          `);
          document.querySelector('div.message-list').prepend(messageItem);
        }
      };

      var postHeight = document.querySelector('div.message-list').scrollTop;

      this.chatElem += (postHeight - preHeight); // Set scroll down to the original height
    }

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
      const messageItem = createDOM(`
        <div class="message my-message">
          <span class="message-user">${message.username}</span>
          <span class="message-text">${message.text}</span>
        </div>
      `);
      this.chatElem.appendChild(messageItem);
    } else if (message.username === 'Summary:') {
      const messageItem = createDOM(`
        <div class="message summary-mess">
          <span class="message-user">${message.username}</span>
          <span class="message-text">${message.text}</span>
        </div>
      `);
      this.chatElem.appendChild(messageItem);
    } else {
      //console.log('making other-mess');
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
  constructor(id, name, image = "assets/grass.png", messages = []) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
    this.getLastConversation = makeConversationLoader(this);
    this.canLoadConversation = true;
    this.startTime = Date.now();
  };

  addMessage(username, text) {
    //no type check on text, converts to string before trimming
    text = sanitize(text);
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

  addConversation(conversation) {
    let getMessages = conversation.messages;
    getMessages.sort((a, b) => b.timestamp - a.timestamp);
    this.messages = getMessages.concat(this.messages);

    if (typeof this.onFetchConversation === 'function') {
      this.onFetchConversation(conversation);
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

  addRoom(id, name, image = "assets/grass.png", messages = []) {
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
        // console.log("xhr response:")
        // console.log(xhr.response)
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
  },

  getLastConversation: async function (roomId, before) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      var url = Service.origin + `/chat/${roomId}/messages${before ? `?before=${before}` : ''}`;
      console.log("url: ", url)
      xhr.open("GET", url);
      xhr.onload = () => {
        if (xhr.status === 200) {
          console.log(xhr.status);
          console.log("App.js xhr response: ")
          console.log(JSON.parse(xhr.response))
          resolve(JSON.parse(xhr.response));
        } else {
          reject(new Error(xhr.responseText));
        }
      }
      xhr.onerror = () => reject(new Error(xhr.responseText));
      xhr.send();
    })
  },

  getProfile: async function () {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", Service.origin + "/profile");
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

  summarize: async function (chatMessages) {  
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/summary");
      xhr.setRequestHeader("Content-Type", "application/json");

      xhr.onload = () => {
          if (xhr.status === 200) {
              resolve(JSON.parse(xhr.response)); // Parse and resolve the response
          } else {
              reject(new Error(xhr.responseText)); // Reject with an error
          }
      };

      xhr.onerror = () => reject(new Error("Network Error")); // Handle network errors

      const payload = {
          message: chatMessages
      };

      xhr.send(JSON.stringify(payload)); // Send the payload
    });
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
  Service.getProfile().then ((res) => {
    profile.username = res.username;
  })

  const socket = new WebSocket("ws://localhost:8000")

  const lobby = new Lobby();

  console.log("page is fully loaded");
  const lobbyView = new LobbyView(lobby);
  const chatView = new ChatView(socket);
  const profileView = new ProfileView();

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
        //console.log(roomsArray);
        for (var i = 0; i < roomsArray.length; i++) {
          let currRoom = roomsArray[i];
          if (lobby.rooms[currRoom._id] !== undefined) {
            lobby.rooms[currRoom._id].name = currRoom.name;
            lobby.rooms[currRoom._id].image = currRoom.image;
          } else {
            lobby.addRoom(currRoom._id, currRoom.name, currRoom.image, currRoom.messages);
          }
        }
      });
  }



  socket.addEventListener("message", (event) => {
    messageData = JSON.parse(event.data);
    const roomId = messageData.roomId;
    const room = lobby.getRoom(roomId);
    console.log("Username is:", messageData.username);
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
    socket: socket,
    testRoomId: 'room-1',
    cookieName: 'cpen322-session',
    testUser1: { username: 'alice', password: 'secret', saltedHash: '1htYvJoddV8mLxq3h7C26/RH2NPMeTDxHIxWn49M/G0wxqh/7Y3cM+kB1Wdjr4I=' },
    testUser2: { username: 'bob', password: 'password', saltedHash: 'MIYB5u3dFYipaBtCYd9fyhhanQkuW4RkoRTUDLYtwd/IjQvYBgMHL+eoZi3Rzhw=' },
    image: 'assets/grass.png',
    webSocketServer: 'ws://localhost:8000',
    profile: profile
  });
}

function sanitize(text) {
  return text.replace(/<script[^>]*>[\s\S]*?<\/script>|on\w+="[^"]*"|<img[^>]*>/gi, '') // remove script tags
  .replace(/<script[^>]*>[\s\S]*?<\/script>|on\w+="[^"]*"|<img[^>]*>/gi, match => { //keep insides
      const allowedTags = ['b', 'i', 'code', 'pre', 'strong', 'em']; // allow formatting tags
      const tagName = match.match(/<\/?([a-zA-Z]+)/);
      if (tagName && allowedTags.includes(tagName[1])) {
          return match;  // return allowed tag
      }
      return '';  // strip disallowed tags
  })
  .replace(/on\w+="[^"]*"/g, ''); //remove handlers
}


window.addEventListener('load', main);
