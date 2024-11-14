const assignment = 'a5';

let exported = null;

const initialize = (data) => {
	exported = data.exported;

	let server = exported.get('server.js');
	
	// attach built in types
	server.Object = Object;
	server.Function = Function;

	// helpers
	const tokenize = (nameString) => {
		let buffer = '', state = '';
		return Array.from(nameString)
			.reduce((tokens, char, index, list) => {

				if (state === 'm-obj'){
					if (char === '/'){
						tokens.lib += tokens.lib ? '/' + buffer : buffer;
						buffer = '';
						state = '';
					}
					else if (char === '['){
						buffer.split('.').forEach(token => tokens.props.push(token));
						buffer = '';
						state = 'comp';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'comp'){
					if (char === "'"){
						state = 'comp-s';
					}
					else if (char === '"'){
						state = 'comp-d';
					}
					else if (/\d/.test(char)){
						buffer += char;
						state = 'comp-n';
					}
					else throw new Error('Parse error - unexpected token at ' + index + ': "' + char + '"');
				}
				else if (state === 'comp-fin'){
					if (char !== ']') throw new Error('Parse error - expecting "]" at ' + index + ' but got: "' + char + '"');
					state = 'obj';
				}
				else if (state === 'comp-s'){
					if (char === "'"){
						tokens.props.push(buffer);
						buffer = '';
						state = 'comp-fin';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'comp-d'){
					if (char === '"'){
						tokens.props.push(buffer);
						buffer = '';
						state = 'comp-fin';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'comp-n'){
					if (char === ']'){
						let num = parseInt(buffer);
						if (isNaN(num)) throw new Error('Parse error - was expecting number index, but got ' + buffer);
						tokens.props.push(num);
						buffer = '';
						state = 'obj';
					}
					else {
						buffer += char;
					}
				}
				else if (state === 'obj'){
					if (char === '['){
						if (buffer) tokens.props.push(buffer);
						buffer = '';
						state = 'comp';
					}
					else if (char === '.'){
						if (buffer) tokens.props.push(buffer);
						buffer = '';
						state = 'obj';
					}
					else if (char === '/'){
						throw new Error('Parse error - was not expecting "/" at ' + index + ' while parsing an object string');
					}
					else {
						buffer += char;
					}
				}
				else {
					if (char === '/'){
						tokens.lib += tokens.lib ? '/' + buffer : buffer;
						buffer = '';
					}
					else if (char === '.'){
						state = 'm-obj';
						buffer += char;
					}
					else if (char === '['){
						buffer.split('.').forEach(token => tokens.props.push(token));
						buffer = '';
						state = 'comp';
					}
					else {
						buffer += char;
					}
				}

				if (index === list.length - 1 && buffer){
					buffer.split('.').forEach(token => tokens.props.push(token));
				}

				return tokens;
			}, { lib: '', props: [] });
	}
	const getProp = (obj, tokens) => (tokens.length > 0) ? getProp(obj[tokens[0]], tokens.slice(1)) : obj;
	const getObjectByString = (nameString) => {
		let tokens = tokenize(nameString);
		return tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props) : getProp(server, tokens.props);
	}
	const setObjectByString = (nameString, value) => {
		try {
			let tokens = tokenize(nameString);
			let obj = tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props.slice(0, -1)) : getProp(server, tokens.props.slice(0, -1));
			obj[tokens.props[tokens.props.length - 1]] = value;
			return { error: null };	
		}
		catch (err){
			return { error: err.message };
		}
		
	}
	const callObjectByString = (nameString, ...args) => {
		let tokens = tokenize(nameString);
		let obj = tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props.slice(0, -1)) : getProp(server, tokens.props.slice(0, -1));
		let func = obj[tokens.props[tokens.props.length - 1]];

		try {
			return func.call(obj, ...args);	
		}
		catch (err){
			if (err instanceof TypeError
				&& err.message === "Cannot read property 'call' of undefined"){
				err.message = 'Failed to invoke "' + nameString + '". Is "' + tokens.props[0] + '" exported?';
				throw err;
			}
			else throw err;
		}
	}
	const deleteObjectByString = (nameString) => {
		try {
			let tokens = tokenize(nameString);
			let obj = tokens.lib ? getProp(module.parent.require(tokens.lib), tokens.props.slice(0, -1)) : getProp(server, tokens.props.slice(0, -1));
			delete obj[tokens.props[tokens.props.length - 1]];
			return { error: null };	
		}
		catch (err){
			return { error: err.message };
		}
	}
	function forEachAsync (asyncCallback, thisArg, delayMs = 0){
		let array = this;
		let self = thisArg || this;
		let boundCallback = asyncCallback.bind(self);

		let next = async (index) => {
			if (index === array.length) return null;

			if (delayMs > 0 && index > 0) await delay(delayMs);
			await boundCallback(array[index], index, array);
			return await next(index + 1);
		}

		return next(0);
	}

	let remotes = {
		getGlobalObject: (name) => {
			if (!server[name]) throw new Error('variable "' + name + '" in server.js was not found/exported');
			return server[name];
		},
		getObjectByString: getObjectByString,
		setObjectByString: setObjectByString,
		callObjectByString: callObjectByString,
		deleteObjectByString: deleteObjectByString,
		checkRequire: (name) => {
			try {
				module.parent.require(name);
				return { error: null };
			}
			catch (err){
				return { error: err.message };
			}
		},
		checkObjectType: (name, typeString) => {
			let obj = getObjectByString(name);
			let type = getObjectByString(typeString);

			return (obj instanceof type);
		},
		callLines: async (list) => {
			let results = [];
			await forEachAsync.call(list, async (line) => {
				// console.log(line);
				let args = line.slice(1);
				let result = callObjectByString(line[0], ...args);
				if (result instanceof Promise){
					result = await result;
				}
				results.push(result);
			});
			return results;
		}
	};

	let expressTests = {
		testCreateSession: (req, res, next, username, maxAge) => {
			// console.log(username, maxAge);
			server.sessionManager.createSession(res, username, maxAge);
			return res.get('Set-Cookie');
		},
		testDeleteSession: (req, res, next, testObj) => {
			let result = {
				request: Object.assign({}, testObj)
			};
			server.sessionManager.deleteSession(result.request);
			return result;
		},
		testMiddleware: (req, res) => {
			return new Promise((resolve, reject) => {
				let next = (arg) => {
					resolve({
						session: req.session,
						username: req.username,
						nextArg: arg
					});
				};
				server.sessionManager.middleware(req, res, next);
				setTimeout(() => reject(new Error('"next" was not called within the timeout duration')), 1000);
			});
		},
		signInTestUser: (req, res, next, testUser, maxAge) => {
			// assumes sessionManager works
			server.sessionManager.createSession(res, testUser, maxAge);
			return true;
		}
	}

	function sendJsonResult (res, result){
		// override toJSON before serializing
		let originalSetToJson = Set.prototype.toJSON;
		Set.prototype.toJSON = function (){
			return Array.from(this);
		}

		let originalErrorToJson = Error.prototype.toJSON;
		Error.prototype.toJSON = function(){
			return {
				type: Object.getPrototypeOf(this).constructor.name,
				message: this.message,
				stack: this.stack
			}
		}

		if (typeof result === 'undefined'){
			res.status(200).send();
		}
		else {
			res.status(200).send(JSON.stringify(result));
		}

		Set.prototype.toJSON = originalSetToJson;
		Error.prototype.toJSON = originalErrorToJson;
	}

	// add a test endpoint
	let app = server['app'];
	
	// inject a middleware at the top of the express middleware stack
	const Layer = require('express/lib/router/layer.js');
	let layer = new Layer('/cpen322/' + assignment + '/middleware', {
		sensitive: true,
		strict: false,
		end: false
	}, function cpen322Middleware(req, res, next){
		// console.log(req.body);

		if (req.body.func === 'throwSessionError'){
			// we assume sessionManager is available
			let SessionError = Object.getPrototypeOf(server.sessionManager).constructor.Error;
			next(new SessionError('Intentional SessionError thrown by the test script'));
			return;
		}
		else if (req.body.func === 'throwError'){
			next(new Error('Intentional Error thrown by the test script'));
			return;
		}
		
		res.status(200).send('OK');
	});
	app._router.stack.splice(5, 0, layer);

	let expressLayer = new Layer('/cpen322/' + assignment + '/express', {
		sensitive: true,
		strict: false,
		end: false
	}, (req, res, next) => {
		if (expressTests[req.body.func]){
			try {
				let result = expressTests[req.body.func](req, res, next, ...req.body.args);

				if (result instanceof Promise){
					new Promise((resolve, reject) => {
						result.then(resolve).catch(reject);
						setTimeout(() => reject(new Error('timed out on an asynchronous action')), 5000);
					})
					.then(val => sendJsonResult(res, val))
					.catch(err => res.status(500).send(err.message + '\n' + err.stack));
					
				}
				else {
					sendJsonResult(res, result);
				}
			}
			catch (err){
				res.status(500).send(err.message + '\n' + err.stack);
			}
		}
		else {
			res.status(400).send('Test method ' + req.body.func + ' does not exist');
		}
	});
	expressLayer.method = 'post';
	app._router.stack.splice(6, 0, expressLayer);

	let remoteLayer = new Layer('/cpen322/' + assignment, {
		sensitive: true,
		strict: false,
		end: false
	}, (req, res) => {
		if (remotes[req.body.func]){
			try {
				let result = remotes[req.body.func](...req.body.args);

				if (result instanceof Promise){
					new Promise((resolve, reject) => {
						result.then(resolve).catch(reject);
						setTimeout(() => reject(new Error('timed out on an asynchronous action')), 5000);
					})
					.then(val => sendJsonResult(res, val))
					.catch(err => res.status(500).send(err.message + '\n' + err.stack));
					
				}
				else {
					sendJsonResult(res, result);
				}
			}
			catch (err){
				res.status(500).send(err.message + '\n' + err.stack);
			}
		}
		else {
			res.status(400).send('Test method ' + req.body.func + ' does not exist');
		}
	});
	remoteLayer.method = 'post';
	app._router.stack.splice(7, 0, remoteLayer);
}

module.exports = { initialize };