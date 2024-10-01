function main() {
    console.log("page is fully loaded");

    // HELPER FUNCTIONS 

    // Removes the contents of the given DOM element (equivalent to elem.innerHTML = '' but faster)
    function emptyDOM(elem) {
        while (elem.firstChild) elem.removeChild(elem.firstChild);
    }

    // Creates a DOM element from the given HTML string
    function createDOM(htmlString) {
        console.log("createDOM");
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

        if (url == "") {

            //div.content to string, then to DOM
            var indexDivContent = document.querySelector('div.content').innerHTML;
            var indexNewDOM = createDOM(indexDivContent);

            emptyDOM(pageView);
            
            //repopulate
            const parentElement = document.getElementById('page-view');
            parentElement.appendChild(indexNewDOM);
        }
    }

    renderRoute();
    window.addEventListener('popstate', renderRoute);
}

window.addEventListener('load', main);
