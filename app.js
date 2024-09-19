import express from 'express';
import session from 'express-session';
import passport from './config/passport.js';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import createError from 'http-errors';
import morgan from 'morgan';
import debug from 'debug';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

// routes
import accountRouter from './routes/account.js';
import driveRouter from './routes/drive.js';

export const app = express();
const errorLog = debug('ServerError');

const corsOptions = {
	origin: process.env.APP_URL,
	methods: ['GET', 'PUT', 'POST', 'DELETE'],
	allowedHeaders: ['Content-Type'],
	credentials: true,
	maxAge: 3600,
};
const helmetOptions = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'none'"],
			imgSrc: ["'self'", 'data:', 'blob:'],
			styleSrc: ["'self'", 'fonts.googleapis.com', 'necolas.github.io'],
			formAction: [
				"'self'",
				`${process.env.NODE_ENV === 'development' ? 'http' : 'https'}:`,
			],
			frameAncestors: ["'none'"],
			baseUri: ["'none'"],
			objectSrc: ["'none'"],
			scriptSrc: ['strict-dynamic'],
		},
	},
	xFrameOptions: { action: 'deny' },
	referrerPolicy: {
		policy: ['no-referrer'],
	},
};
const sessionOptions = {
	secret: process.env.SESSION_SECRETS.split(','),
	resave: false,
	saveUninitialized: false,
	store: new PrismaSessionStore(new PrismaClient(), {
		checkPeriod: 60 * 60 * 1000, // ms
		dbRecordIdIsSessionId: true,
		dbRecordIdFunction: undefined,
	}),
	cookie: {
		sameSite: 'Strict',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		maxAge: 7 * 24 * 60 * 60 * 1000,
	},
	name: 'local-drive.connect.sid',
};

app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(session(sessionOptions));
app.use(passport.session());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev'));
app.use(compression());

app.use('/account', accountRouter);
app.use('/drive', driveRouter);

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
