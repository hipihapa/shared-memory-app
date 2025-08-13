import express from "express";
import { checkUserExists, createUser } from "../controllers/controllers";

const router = express.Router();

// User routes
router.get("/:uid/exists", checkUserExists);
router.post("/", createUser);

export default router;
