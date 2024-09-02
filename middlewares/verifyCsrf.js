import asyncHandler from "express-async-handler";
import Csrf from "csrf";
import debug from "debug";
const serverLog = debug("Server");

const verifyCsrf = asyncHandler((req, res, next) => {
	const csrf = new Csrf();

	const setSession = () => {
		delete req.session.csrf;
		next();
	};

	const handleError = () => {
		serverLog("The csrf token is invalid.");
		res.render("error");
	};

	csrf.verify(req.session.csrf, req.body.csrfToken)
		? setSession()
		: handleError();
});

export default verifyCsrf;
