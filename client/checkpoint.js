function main() {
    console.log("page is fully loaded");
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

    // ********************

    function renderRoute() {
        var url = window.location.hash;
        console.log("current url: " + url);

        var pageView = document.getElementById('page-view');

        if (url == "#/") {
            
            console.log("page-view");
            console.log(pageView);

            console.log("content");
            var content = document.getElementsByClassName("content")[0];
            console.log(content);
            
            emptyDOM(pageView);
            pageView.appendChild(content);
            
        }
    }

    window.addEventListener('popstate', renderRoute);
    window.addEventListener('hashchange', renderRoute);
    
    cpen322.export(arguments.callee, {
        renderRoute: renderRoute,
        // lobbyView: lobbyView
    });
}    



window.addEventListener('load', main);
