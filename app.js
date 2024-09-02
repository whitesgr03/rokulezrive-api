import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

import express from "express";
import session from "express-session";
import passport from "./config/passport.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import { PrismaClient } from "@prisma/client";
import createError from "http-errors";
import morgan from "morgan";
import debug from "debug";
import compression from "compression";
import helmet from "helmet";

// routes
import indexRouter from "./routes/index.js";
import accountRouter from "./routes/account.js";
import driveRouter from "./routes/drive.js";

const app = express();
const errorLog = debug("ServerError");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use((req, res, next) => {
	res.locals.cspNonce = randomBytes(16).toString("base64");
	next();
});

const helmetOptions = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'none'"],
			imgSrc: ["'self'", "data:", "blob:"],
			styleSrc: [
				"'self'",
				"fonts.googleapis.com",
				"necolas.github.io",
				(req, res) => `'nonce-${res.locals.cspNonce}'`,
			],
			formAction: [
				"'self'",
				`${process.env.NODE_ENV === "development" ? "http" : "https"}:`,
			],
			frameAncestors: ["'none'"],
			baseUri: ["'none'"],
			objectSrc: ["'none'"],
			scriptSrc: [
				(req, res) => `'nonce-${res.locals.cspNonce}'`,
				"strict-dynamic",
			],
		},
	},
	xFrameOptions: { action: "deny" },
	referrerPolicy: {
		policy: ["no-referrer"],
	},
};
const staticOptions = {
	index: false,
	redirect: false,
};
const sessionOptions = {
	secret: process.env.SESSION_SECRETS.split(","),
	resave: false,
	saveUninitialized: false,
	store: new PrismaSessionStore(new PrismaClient(), {
		checkPeriod: 60 * 60 * 1000, //ms
		dbRecordIdIsSessionId: true,
		dbRecordIdFunction: undefined,
	}),
	cookie: {
		sameSite: "Lax",
		httpOnly: true,
		secure: true,
		maxAge: 7 * 24 * 60 * 60 * 1000,
	},
	name: "local-drive.connect.sid",
};

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(helmet(helmetOptions));
app.use(session(sessionOptions));
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public"), staticOptions));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.production ? "common" : "dev"));
app.use(compression());

app.use((req, res, next) => {
	req.isAuthenticated() && (res.locals.user = true);
	next();
});

app.get("/favicon.ico", (req, res) => res.status(204));
app.use("/", indexRouter);
app.use("/account", accountRouter);
app.use("/drive", driveRouter);

// unknown routes handler
app.use((req, res, next) => {
	next(createError(404, "The endpoint you are looking for cannot be found."));
});

// error handler
app.use((err, req, res, next) => {
	errorLog(err);

	err.status ?? (err = createError(500));

	res.render("error", { message: err.message });
});

export default app;
