function main() {
    console.log("page is fully loaded");
    const indexContent = document.getElementsByClassName("content")[0];
    const profileContent = document.getElementsByClassName("content")[1];
    const chatContent = document.getElementsByClassName("content")[2];

    renderRoute();

    // HELPER FUNCTIONS 

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
    
    //****THIS IS PROBABLY GARBAGE */
    class LobbyView {
        constructor() {
          this.elem = createDOM(`<div class="content">
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
          </div>`);
        }

    }
    console.log("lobby view");
    var lobbyView = new LobbyView();
    console.log(lobbyView);

    // ***********END GARBAGE *********

    function renderRoute() {

        var url = window.location.hash;
        console.log("current url: " + url);

        var pageView = document.getElementById('page-view');

        if (url == "#/") {
            console.log("indexContent");
            console.log(indexContent);
            emptyDOM(pageView);
            pageView.appendChild(indexContent);

        }

        else if (url == "#/profile") {
            console.log("profileContent");
            console.log(profileContent);
            emptyDOM(pageView);
            pageView.appendChild(profileContent);

        }

        else if (url == "#/chat/room-1") {
            console.log("chatContent");
            console.log(chatContent);
            emptyDOM(pageView);
            pageView.appendChild(chatContent);

        }

    }

    window.addEventListener('popstate', renderRoute);
    window.addEventListener('hashchange', renderRoute);

    cpen322.export(arguments.callee, {
        renderRoute: renderRoute,
        lobbyView: lobbyView
    });
}



window.addEventListener('load', main);
