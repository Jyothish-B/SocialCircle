import express from "express";
import {
  getProfile,
  updateProfile,
  getAllCompaniesAndPlaces,
  createEntity,
} from "../controllers/profile_controller.js";

const router = express.Router();

router.get("/", getProfile);
router.put("/", updateProfile);
router.get("/entities", getAllCompaniesAndPlaces);
router.post("/entities", createEntity);

export default router;
