import express from "express";

const router = express.Router();

router.get("/", (req, res) => res.redirect("/drive/files"));

export default router;
