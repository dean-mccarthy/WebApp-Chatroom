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
        const randStringTok = crypto.randomBytes

        const token = {
            username: username,
            timestamp: Date.now(),
            maxAge: Date.now() + CookieMaxAgeMs
        }

        sessions[randStringTok] = token;

        response.cookie('cpen322-session', token, { maxAge: maxAge || defaultMaxAge });
        
        setTimeout(() => { //chatgpt
            delete sessions[token];
            console.log(`Session with token ${token} has been deleted.`);
          }, maxAge || defaultMaxAge);
    };

    this.deleteSession = (request) => {
        /* To be implemented */
    };

    this.middleware = (request, response, next) => {
        /* To be implemented */
    };

    // this function is used by the test script.
    // you can use it if you want.
    this.getUsername = (token) => ((token in sessions) ? sessions[token].username : null);
};

// SessionError class is available to other modules as "SessionManager.Error"
SessionManager.Error = SessionError;

module.exports = SessionManager;