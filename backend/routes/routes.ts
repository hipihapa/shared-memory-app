import express from "express";
import multer from "multer";
import {
  createSpace,
  getUserSpaceId,
  getSpaceBySlug,
  getSpaceById,
  uploadMedia,
  getSpaceMedia,
  updateSpaceMode,
  deleteMedia,
  initializePayment,
  paystackWebhook,
  verifyPayment,
  checkUrlSlugAvailability
} from "../controllers/controllers";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Space routes
router.post("/", createSpace);
router.get("/user/:userId/spaceId", getUserSpaceId);
router.get("/:urlSlug", getSpaceBySlug);
router.get("/id/:spaceId", getSpaceById);
router.patch("/:spaceId/mode", updateSpaceMode);
router.get("/check-slug/:urlSlug", checkUrlSlugAvailability);

// Media routes
router.post("/:spaceId/media", upload.single("file"), uploadMedia);
router.get("/:spaceId/media", getSpaceMedia);
router.delete("/:spaceId/media/:mediaId", deleteMedia);

// Payment routes
router.post("/paystack/initialize", initializePayment);
router.post('/paystack/webhook', express.json({ type: 'application/json' }), paystackWebhook);
router.post("/verify-payment", verifyPayment);

export default router;