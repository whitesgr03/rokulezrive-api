import passport from '../config/passport.js';

export const authenticate = (req, res, next) => {
	const cb = (err, user, failMessage) => {
		const handleError = async () => {
			res.status(404).json({
				success: false,
				fields: {
					email: failMessage,
				},
			});
		};

		const handleLogin = () => {
			const { pk, ...rest } = user;

			req.login({ pk }, () => {
				res.json({
					success: true,
					data: rest,
					cookie: {
						exp: req.session.cookie._expires,
					},
					message: 'User login successfully.',
				});
			});
		};

		err && next(err);
		failMessage && handleError();
		user && handleLogin();
	};

	passport.authenticate('local', cb)(req, res, next);
};
