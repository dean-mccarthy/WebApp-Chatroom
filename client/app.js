class LobbyView {
  constructor() { // TODO: Change <a> to be the whole box after we get assn1 evalutated
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
  }
}


class Room {
  constructor(id, name, image = "assets/everyone-icon.png", messages = []) {
    this.id = id;
    this.name = name;
    this.image = image;
    this.messages = messages;
    console.log("Creating New room with id:" + id);
  };

  addMessage(username, text) {
    if (text == "" || text.trim().length == 0) //if text is empty or only whitespaces
      return;
    else {
      const message = {
        username: username,
        text: text,
      };
      this.messages.push(message);
      return;
    }
  }
}

class Lobby {
  constructor() {
    console.log("Creating New Lobby");
    this.rooms = {};
    this.rooms[1] = new Room(1, `Room 1`);
    this.rooms[2] = new Room(2, `Room 2`);
    this.rooms[3] = new Room(3, `Room 3`);
    this.rooms[4] = new Room(4, `Room 4`);
    };

  getRoom(roomId) {
    if (this.rooms[roomId]) {
      return this.rooms[roomId];
    }
    else
      return null;
  }

  //broken. not adding a room correctly.
  addRoom(id, name, image, messages) {
    console.log("Rooms before: ");
    console.log(this.rooms);
    console.log("# of rooms: " + this.rooms.length);
    if (this.getRoom(id)) {
      console.log("Could not create room: Room with this ID already exists");
      return;
    }
    else {
      this.rooms[id] = new Room(id, name, image, messages);
      console.log("Rooms after: ");
      console.log(this.rooms);
      console.log("# of rooms: " + this.rooms.length);
      return;
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

// Helper Functions

// Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
function emptyDOM(elem) {
  while (elem.firstChild) elem.removeChild(elem.firstChild);
}

// Creates a DOM element from the given HTML string
function createDOM(htmlString) {
  console.log("createDOM");
  console.log(htmlString);
  let template = document.createElement('template');
  template.innerHTML = htmlString.trim();
  console.log(template.content.firstChild);
  return template.content.firstChild;
}

function main() {
  console.log("page is fully loaded");
  const lobbyView = new LobbyView();
  const chatView = new ChatView();
  const profileView = new ProfileView();

  renderRoute();

  function renderRoute() {

    const path = window.location.hash.substring(2);
    const url = path.split('/')[0];
    const pageView = document.getElementById('page-view');

    if (url == "") {
      console.log("indexContent");
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
      console.log("chatContent");
      //console.log(chatContent);
      emptyDOM(pageView);
      pageView.appendChild(chatView.elem);

    }

  }

  window.addEventListener('popstate', renderRoute);
  window.addEventListener('hashchange', renderRoute);

  cpen322.export(arguments.callee, {
    renderRoute: renderRoute,
    lobbyView: lobbyView,
    chatView: chatView,
    profileView: profileView
  });
}


window.addEventListener('load', main);
