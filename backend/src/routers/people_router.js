import express from "express";
import { searchPeople, getPerson } from "../controllers/people_controller.js";

const router = express.Router();

router.get("/search", searchPeople);
router.get("/:id", getPerson);

export default router;
