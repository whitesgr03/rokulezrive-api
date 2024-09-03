import express from "express";

import * as fileControllers from "../controllers/file.js";

const router = express.Router();

router.get("/", fileControllers.index);

export default router;
