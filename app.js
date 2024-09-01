import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

import express from "express";
import createError from "http-errors";
import morgan from "morgan";
import debug from "debug";
import compression from "compression";
import helmet from "helmet";

// routes
import indexRouter from "./routes/index.js";
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

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(helmet(helmetOptions));
app.use(express.static(path.join(__dirname, "public"), staticOptions));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.production ? "common" : "dev"));
app.use(compression());

app.get("/favicon.ico", (req, res) => res.status(204));
app.use("/", indexRouter);
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
