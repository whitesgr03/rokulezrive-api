import { networkInterfaces } from 'node:os';
import debug from 'debug';

import { app } from './app.js';

const serverLog = debug('Server');

const port = process.env.PORT || '3000';
const development = process.env.NODE_ENV === 'development';

const handleServer = async () => {
	const handleListening = async () => {
		const IP_Address = networkInterfaces().en0.find(
			internet => internet.family === 'IPv4'
		).address;

		serverLog(`Listening on Local:         http://localhost:${port}`);
		serverLog(`Listening on Your Network:  http://${IP_Address}:${port}`);
	};
	const handleError = error => {
		switch (error.code) {
			case 'EACCES':
				serverLog(`Port ${port} requires elevated privileges`);
				break;
			case 'EADDRINUSE':
				serverLog(`Port ${port} is already in use`);
				break;
			default:
				serverLog(error);
		}
	};
	const handleClose = () => {
		serverLog(`There has an Error, so the server is closed.`);
		process.exit(1);
	};

	app
		.listen(port, development && handleListening)
		.on('error', handleError)
		.on('close', handleClose);
};

handleServer();
