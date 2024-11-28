import express from "express";
import { getFriends } from "../controllers/friends_controller.js";

const router = express.Router();

router.get("/", getFriends);

export default router;
