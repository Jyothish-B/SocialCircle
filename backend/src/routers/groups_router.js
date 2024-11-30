import express from "express";
import { getGroups, joinGroup, quitGroup, getAllGroups } from "../controllers/groups_controller.js";

const router = express.Router();

router.get("/", getGroups);
router.post("/join", joinGroup);
router.delete("/quit", quitGroup);
router.get("/all", getAllGroups);

export default router;
