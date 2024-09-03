import express from "express";

const router = express.Router();

router.get("/", (req, res) => res.redirect("/drive"));

export default router;
