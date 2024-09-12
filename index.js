import { networkInterfaces } from 'node:os';
import debug from 'debug';
import { createServer } from 'node:https';
import { readFileSync } from 'node:fs';

import app from './app.js';

const serverLog = debug('Server');

const port = process.env.PORT || '3000';
const develop = process.env.NODE_ENV === 'development';

const handleServer = async () => {
	const handleListening = async () => {
		const IP_Address = networkInterfaces().en0.find(
			internet => internet.family === 'IPv4',
		).address;

		const scheme = `http${develop ? 's' : ''}`;

		serverLog(`Listening on Local:         ${scheme}://localhost:${port}`);
		serverLog(`Listening on Your Network:  ${scheme}://${IP_Address}:${port}`);
	};
	const handleError = error => {
		switch (error.code) {
			case 'EACCES':
				serverLog(`Port ${port} requires elevated privileges`);
				app.close();
			case 'EADDRINUSE':
				serverLog(`Port ${port} is already in use`);
				app.close();
			default:
				serverLog(error);
		}
	};
	const handleClose = () => {
		serverLog(`There has an Error, so the server is closed.`);
		process.exit(1);
	};
	const handleHTTPS = () => {
		const options = {
			key: readFileSync('key.pem'),
			cert: readFileSync('cert.pem'),
		};
		return createServer(options, app);
	};

	const server = develop ? handleHTTPS() : app;

	server
		.listen(port, develop && handleListening)
		.on('error', handleError)
		.on('close', handleClose);
};

handleServer();
