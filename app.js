import express from 'express';
import createError from 'http-errors';
import morgan from 'morgan';
import debug from 'debug';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

// routes
import apiRouter from './routes/api.js';

export const app = express();
const errorLog = debug('ServerError');

const corsOptions = {
	origin:
		process.env.NODE_ENV === 'production'
			? process.env.APP_URL
			: process.env.LOCAL_APP_URL,
	methods: ['GET', 'POST', 'PATCH', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	maxAge: 3600,
};
const helmetOptions = {
	xFrameOptions: { action: 'deny' },
};

process.env.NODE_ENV === 'production' && app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev'));
app.use(compression());

app.use('/api', apiRouter);

// unknown routes handler
app.use((req, res, next) => {
	next(createError(404, 'The endpoint you are looking for cannot be found.'));
});

// error handler
/* eslint-disable no-unused-vars */
app.use((err, req, res, next) => {
	/* eslint-enable */
	errorLog(err);

	err.status ?? (err = createError(500));

	res.json({
		success: false,
		message: err.message,
	});
});
