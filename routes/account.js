import express from "express";

import * as userControllers from "../controllers/user.js";

const router = express.Router();

router
	.route("/login")
	.get(userControllers.loginGet)
router
	.route("/register")
	.get(userControllers.registerGet)
	.post(userControllers.registerPost);
export default router;
