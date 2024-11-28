import express from "express";
import { getGroups } from "../controllers/groups_controller.js";

const router = express.Router();

router.get("/", getGroups);

export default router;
