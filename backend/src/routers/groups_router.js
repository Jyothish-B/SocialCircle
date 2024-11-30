import express from "express";
import {
  getGroups,
  joinGroup,
  quitGroup,
  getAllGroups,
  getMyGroups,
  getSuggestedGroups,
} from "../controllers/groups_controller.js";

const router = express.Router();

router.get("/", getGroups);
router.post("/join", joinGroup);
router.delete("/quit", quitGroup);
router.get("/all", getAllGroups);
router.get("/my-groups", getMyGroups);
router.get("/suggested", getSuggestedGroups);

export default router;
