import express from 'express';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';

// routes
import { apiRouter } from './routes/api.js';

// Middlewares
import { handleError, handleUnknownRoutes } from './middlewares/handleError.js';

export const app = express();

const corsOptions = {
	origin: process.env.APP_URL,
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
app.use(handleUnknownRoutes);

// error handler
app.use(handleError);
