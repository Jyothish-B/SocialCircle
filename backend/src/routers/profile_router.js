import express from "express";
import { getProfile } from "../controllers/profile_controller.js";

const router = express.Router();

router.get("/", getProfile);

export default router;
