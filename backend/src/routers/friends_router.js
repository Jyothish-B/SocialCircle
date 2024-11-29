import express from "express";
import {
  getFriends,
  getAllUsers,
  addFriend,
  removeFriend,
} from "../controllers/friends_controller.js";

const router = express.Router();

router.get("/", getFriends);
router.get("/users", getAllUsers);
router.post("/add", addFriend);
router.post("/remove", removeFriend);

export default router;
