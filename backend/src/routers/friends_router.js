import express from "express";
import {
  getFriends,
  getAllUsers,
  addFriend,
  removeFriend,
  getSuggestedFriends,
} from "../controllers/friends_controller.js";
import {
  sendRequest,
  getRequests,
  acceptRequest,
  declineRequest,
  cancelRequest,
} from "../controllers/requests_controller.js";

const router = express.Router();

router.get("/", getFriends);
router.get("/users", getAllUsers);
router.post("/add", addFriend);
router.post("/remove", removeFriend);
router.get("/suggested", getSuggestedFriends);
router.post("/request", sendRequest);
router.get("/requests", getRequests);
router.post("/requests/accept", acceptRequest);
router.post("/requests/decline", declineRequest);
router.post("/requests/cancel", cancelRequest);

export default router;
