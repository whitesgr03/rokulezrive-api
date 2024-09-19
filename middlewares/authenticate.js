import passport from '../config/passport.js';

export const authenticate = (req, res, next) => {
	const cb = (err, user, failInfo) => {
		const handleError = async () => {
			res.status(404).json({
				success: false,
				message: {
					email: { msg: failInfo },
				},
			});
		};

		const handleLogin = () => {
			req.login(user, () => {
				res.json({
					success: true,
					data: {
						user,
					},
					cookie: {
						exp: req.session.cookie._expires,
					},
					message: 'User login successfully.',
				});
			});
		};

		err && next(err);
		failInfo && handleError();
		user && handleLogin();
	};

	passport.authenticate('local', cb)(req, res, next);
};
