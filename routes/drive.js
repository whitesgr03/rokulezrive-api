import express from "express";
const router = express.Router();
router.get("/", (req, res) => res.render("index"));
router.get("/files", (req, res) => res.render("file_list"));
export default router;
