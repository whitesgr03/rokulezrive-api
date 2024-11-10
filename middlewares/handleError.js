import createError from 'http-errors';
import debug from 'debug';

const errorLog = debug('ServerError');

export const handleUnknownRoutes = (req, res, next) => {
	next(createError(404, 'The endpoint you are looking for cannot be found.'));
};

/* eslint-disable no-unused-vars */
export const handleError = (err, req, res, next) => {
	/* eslint-enable */
	errorLog(err);

	err.status ?? (err = createError(500));

	res.json({
		success: false,
		message: err.message,
	});
};
