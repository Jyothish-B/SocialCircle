import express from "express";
import { getEgoGraph } from "../controllers/graph_controller.js";

const router = express.Router();

router.get("/ego", getEgoGraph);

export default router;
