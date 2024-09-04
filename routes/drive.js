import express from "express";

import * as fileControllers from "../controllers/file.js";

const router = express.Router();

router.use((req, res, next) => {
	req.isAuthenticated() ? next() : res.redirect("/");
});

router.route("/files/create").get(fileControllers.fileCreateGet);
router.get("/files", fileControllers.fileList);

router.get("/shared", fileControllers.sharedList);

router.get("/", fileControllers.index);

export default router;
