import express from "express";
import Space from "../models/space";
import Media from "../models/media";
import multer from "multer";
import cloudinary from "cloudinary";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Create a new space
router.post("/", async (req, res) => {
  try {
    const newSpace = new Space(req.body);
    await newSpace.save();
    res.status(201).json(newSpace);
  } catch (error) {
    console.error("Error creating space:", error);
    res
      .status(500)
      .json({
        message: "Failed to create space",
        error: (error as Error).message,
      });
  }
});

// Get a user's spaceId by userId
router.get("/user/:userId/spaceId", async (req, res): Promise<void> => {
  try {
    const { userId } = req.params;
    const space = await Space.findOne({ userId });
    if (!space) {
      res.status(404).json({ message: "Space not found for this user" });
      return;
    }
    res.json({ spaceId: space._id });
  } catch (error) {
    console.error("Error fetching user spaceId:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch user spaceId",
        error: (error as Error).message,
      });
  }
});

// Get space by URL slug
router.get("/:urlSlug", async (req, res): Promise<void> => {
  try {
    const space = await Space.findOne({ urlSlug: req.params.urlSlug });
    if (!space) {
      res.status(404).json({ message: "Space not found" });
      return;
    }
    res.json(space);
  } catch (error) {
    console.error("Error fetching space:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch space",
        error: (error as Error).message,
      });
  }
});

// Get space (spaceId)
router.get("/id/:spaceId", async (req, res): Promise<void> => {
  try {
    const space = await Space.findById(req.params.spaceId);
    if (!space) {
      res.status(404).json({ message: "Space not found" });
      return;
    }
    res.json(space);
  } catch (error) {
    console.error("Error fetching space by ID:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch space by ID",
        error: (error as Error).message,
      });
  }
});

// Cloudinary config (add your credentials to .env)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload media to a space
router.post("/:spaceId/media", upload.single("file"),
  async (req, res): Promise<void> => {
    try {
      const { spaceId } = req.params;
      const { uploadedBy } = req.body;

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      // Check if space exists
      const space = await Space.findById(spaceId);
      if (!space) {
        res.status(404).json({ message: "Space not found" });
        return;
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload_stream(
        {
          folder: `memoryshare/${spaceId}`,
          resource_type: "auto",
        },
        async (error, result) => {
          if (error || !result) {
            console.error("Cloudinary upload error:", error);
            res.status(500).json({ message: "Failed to upload file", error: error?.message });
            return;
          }

          // Save media metadata to MongoDB
          const newMedia = new Media({
            spaceId,
            fileName: result.original_filename,
            fileUrl: result.secure_url,
            fileType: result.resource_type,
            uploadedBy: uploadedBy || "Guest",
          });

          await newMedia.save();
          res.status(201).json(newMedia);
        }
      );

      // Pipe the file buffer to Cloudinary
      if (req.file && req.file.buffer) {
        const stream = uploadResult;
        stream.end(req.file.buffer);
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      res
        .status(500)
        .json({
          message: "Failed to upload media",
          error: (error as Error).message,
        });
    }
  }
);

// Get all media for a space
router.get("/:spaceId/media", async (req, res): Promise<void> => {
  try {
    const { spaceId } = req.params;

    // Check if space exists and if it's public
    const space = await Space.findById(spaceId);
    if (!space) {
      res.status(404).json({ message: "Space not found" });
      return; 
    }

    const media = await Media.find({ spaceId }).sort({ uploadedAt: -1 });
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch media",
        error: (error as Error).message,
      });
  }
});

router.patch("/:spaceId/mode", async (req, res):Promise<void> => {
  try {
    const { spaceId } = req.params;
    const { isPublic } = req.body;
    const space = await Space.findByIdAndUpdate(
      spaceId, { isPublic }, { new: true }
    );
    if(!space) {
      res.status(404).json({ message: "Space not found"});
      return 
    }
    res.json(space);
  } catch (error) {
    res.status(500).json({ message: "Failed to update mode", error: (error as Error).message });
  }
})



// Delete media by ID
router.delete("/:spaceId/media/:mediaId", async (req, res): Promise<void> => {
  try {
    const { spaceId, mediaId } = req.params;
    const media = await Media.findById(mediaId);
    if (!media) {
      res.status(404).json({ message: "Media not found" });
      return;
    }

    // Remove from Cloudinary
    // Extract public_id from fileUrl (Cloudinary URLs contain the public_id before the extension)
    const publicIdMatch = media.fileUrl.match(/memoryshare\/[^/]+\/([^\.]+)/);
    if (publicIdMatch && publicIdMatch[1]) {
      const publicId = `memoryshare/${spaceId}/${publicIdMatch[1]}`;
      await cloudinary.v2.uploader.destroy(publicId, { resource_type: media.fileType });
    }

    // Remove from MongoDB
    await Media.findByIdAndDelete(mediaId);

    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({
      message: "Failed to delete media",
      error: (error as Error).message,
    });
  }
});

export default router;
