import passport from "../config/passport.js";
import asyncHandler from "express-async-handler";
import Csrf from "csrf";

const authenticate = asyncHandler((req, res, next) => {
	const cb = async (err, user, failInfo) => {
		const handleError = async () => {
			const csrf = new Csrf();
			const secret = await csrf.secret();
			req.session.csrf = secret;
			res.render("login", {
				data: req.data,
				csrfToken: csrf.create(secret),
				inputErrors: {
					email: { msg: failInfo },
				},
			});
		};

		const handleLogin = () => {
			const cb = () => {
				res.redirect(`/drive/files`);
			};

			req.login(user, cb);
		};

		err && next(err);
		failInfo && (await handleError());
		user && handleLogin();
	};

	passport.authenticate("local", cb)(req, res, next);
});

export default authenticate;
