const crypto = require('crypto');

class SessionError extends Error { };

function SessionManager() {
    // default session length - you might want to
    // set this to something small during development
    const CookieMaxAgeMs = 600000;
    const defaultMaxAge = 3600000; // 1 hour in milliseconds
    
    // keeping the session data inside a closure to keep them protected
    const sessions = {};

    // might be worth thinking about why we create these functions
    // as anonymous functions (per each instance) and not as prototype methods
    this.createSession = (response, username, maxAge = CookieMaxAgeMs) => {
        console.log("createSession")
        const token = crypto.randomBytes(64).toString('hex');

        // console.log("token: ", token)
        const sessionData = {
            username: username,
            timestamp: Date.now(),
            maxAge: Date.now() + CookieMaxAgeMs
        }
        // console.log("sessionData: ")
        // console.log(sessionData)

        sessions[token] = sessionData;

        response.cookie('cpen322-session', token, { maxAge: maxAge || defaultMaxAge });
        
        
        setTimeout(() => { //chatgpt
            delete sessions[token];
            // console.log("Session with token ", token, " has been deleted.");
          }, maxAge || defaultMaxAge);
    };

    this.deleteSession = (request) => {
        /* To be implemented */
    };

    this.middleware = (request, response, next) => {
        const cookie = request.get('cookie')
        
        console.log("cookie: ", cookie)

        if(request.get('cookie')){

            const cookies = cookie.split(';');
            const cookieValue = cookies[0].split('=')[1].trim();
            console.log("cookieValue", cookieValue);

            if(sessions[cookieValue]){
                console.log("session found, standby")
                console.log("username: ", sessions[cookieValue])
                request.username = sessions[cookieValue].username;
                request.session = cookieValue;
                next();

            } else {
                next(new SessionError('Session cookie not found'));
            }
        } else {
            next(new SessionError('Session cookie not found'));
        }
    };


    // this function is used by the test script.
    // you can use it if you want.
    this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;