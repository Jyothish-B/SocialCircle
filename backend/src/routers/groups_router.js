import express from "express";
import { getGroups, joinGroup, quitGroup } from "../controllers/groups_controller.js";

const router = express.Router();

router.get("/", getGroups);
router.post("/join", joinGroup);
router.delete("/quit", quitGroup);

export default router;
