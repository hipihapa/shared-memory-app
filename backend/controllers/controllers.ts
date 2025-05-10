import Space from "../models/space";
import Media from "../models/media";
import multer from "multer";
import cloudinary from "cloudinary";
import axios from "axios";
import User from "../models/user";


const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const PLAN_STORAGE_LIMITS = {
  basic: 50 * 1024 * 1024,      // 50MB
  premium: 1024 * 1024 * 1024,  // 1GB
  forever: 5 * 1024 * 1024 * 1024 // 5GB
};

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createSpace = async (req: any, res: any) => {
  try {
    const newSpace = new Space(req.body);
    await newSpace.save();
    res.status(201).json(newSpace);
  } catch (error) {
    console.error("Error creating space:", error);
    res.status(500).json({
      message: "Failed to create space",
      error: (error as Error).message,
    });
  }
};

export const getUserSpaceId = async (req: any, res: any) => {
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
    res.status(500).json({
      message: "Failed to fetch user spaceId",
      error: (error as Error).message,
    });
  }
};

export const getSpaceBySlug = async (req: any, res: any) => {
  try {
    const space = await Space.findOne({ urlSlug: req.params.urlSlug });
    if (!space) {
      res.status(404).json({ message: "Space not found" });
      return;
    }
    res.json(space);
  } catch (error) {
    console.error("Error fetching space:", error);
    res.status(500).json({
      message: "Failed to fetch space",
      error: (error as Error).message,
    });
  }
};

export const getSpaceById = async (req: any, res: any) => {
  try {
    const space = await Space.findById(req.params.spaceId);
    if (!space) {
      res.status(404).json({ message: "Space not found" });
      return;
    }
    res.json(space);
  } catch (error) {
    console.error("Error fetching space by ID:", error);
    res.status(500).json({
      message: "Failed to fetch space by ID",
      error: (error as Error).message,
    });
  }
};

export const uploadMedia = async (req: any, res: any) => {
  const session = await Media.startSession();
  session.startTransaction();
  try {
    const { spaceId } = req.params;
    const { uploadedBy } = req.body;

    if (!req.file) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const space = await Space.findById(spaceId).session(session);
    if (!space) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({ message: "Space not found" });
      return;
    }

    const userPlan = (space as any).plan || 'basic';
    const storageLimit = PLAN_STORAGE_LIMITS[userPlan as keyof typeof PLAN_STORAGE_LIMITS];

    const mediaCount = await Media.countDocuments({ spaceId }).session(session);
    let maxAllowed = 10;
    if (userPlan === "premium") maxAllowed = 500;
    else if (userPlan === "forever") maxAllowed = 3000;

    if (mediaCount >= maxAllowed) {
      await session.abortTransaction();
      session.endSession();
      res.status(403).json({ message: `Your plan allows only ${maxAllowed} media uploads.` });
      return;
    }

    const mediaFiles = await Media.find({ spaceId }).session(session);
    let totalUsed = 0;
    for (const media of mediaFiles) {
      totalUsed += (media as any).fileSize || 0;
    }

    const newFileSize = req.file.size;
    if (totalUsed + newFileSize > storageLimit) {
      await session.abortTransaction();
      session.endSession();
      res.status(403).json({ message: "Storage limit exceeded for your plan. Please upgrade to upload more." });
      return;
    }

    const uploadResult = cloudinary.v2.uploader.upload_stream(
      {
        folder: `memoryshare/${spaceId}`,
        resource_type: "auto",
      },
      async (error, result) => {
        if (error || !result) {
          await session.abortTransaction();
          session.endSession();
          console.error("Cloudinary upload error:", error);
          res.status(500).json({ message: "Failed to upload file", error: error?.message });
          return;
        }

        const newMedia = new Media({
          spaceId,
          fileName: result.original_filename,
          fileUrl: result.secure_url,
          fileType: result.resource_type,
          fileSize: req.file?.size || 0,
          uploadedBy: uploadedBy || "Guest",
        });

        await newMedia.save({ session });
        await session.commitTransaction();
        session.endSession();
        res.status(201).json(newMedia);
      }
    );

    if (req.file && req.file.buffer) {
      const stream = uploadResult;
      stream.end(req.file.buffer);
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error uploading media:", error);
    res.status(500).json({
      message: "Failed to upload media",
      error: (error as Error).message,
    });
  }
};

export const getSpaceMedia = async (req: any, res: any) => {
  try {
    const { spaceId } = req.params;
    const space = await Space.findById(spaceId);
    if (!space) {
      res.status(404).json({ message: "Space not found" });
      return; 
    }

    const media = await Media.find({ spaceId }).sort({ uploadedAt: -1 });
    res.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({
      message: "Failed to fetch media",
      error: (error as Error).message,
    });
  }
};

export const updateSpaceMode = async (req: any, res: any) => {
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
};

export const deleteMedia = async (req: any, res: any) => {
  try {
    const { spaceId, mediaId } = req.params;
    const media = await Media.findById(mediaId);
    if (!media) {
      res.status(404).json({ message: "Media not found" });
      return;
    }

    const publicIdMatch = media.fileUrl.match(/memoryshare\/[^/]+\/([^\.]+)/);
    if (publicIdMatch && publicIdMatch[1]) {
      const publicId = `memoryshare/${spaceId}/${publicIdMatch[1]}`;
      await cloudinary.v2.uploader.destroy(publicId, { resource_type: media.fileType });
    }

    await Media.findByIdAndDelete(mediaId);
    res.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({
      message: "Failed to delete media",
      error: (error as Error).message,
    });
  }
};

export const initializePayment = async (req: any, res: any) => {
  try {
    const { email, amount, currency, plan, paymentMethod, phone, provider } = req.body;
    const paystackAmount = Math.round(Number(amount) * 100);

    const payload = {
      email,
      amount,
      currency,
      metadata: {
        plan,
        paymentMethod,
        phone,
        provider,
      },
    };

    if (paymentMethod === "mobile") {
      (payload as any).mobile_money = {
        phone,
        provider,
      };
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data.data);
  } catch (error) {
    console.error("Paystack init error:", (error as any)?.response?.data || error);
    res.status(500).json({ message: "Failed to initialize payment", error: (error as any)?.response?.data || error });
  }
};

export const paystackWebhook = async (req: any, res: any) => {
  const hash = req.headers['x-paystack-signature'];
  const secret = PAYSTACK_SECRET_KEY;

  const crypto = require('crypto');
  const expectedHash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
  if (hash !== expectedHash) {
    res.status(401).send('Unauthorized');
    return 
  }

  const event = req.body;
  if (event.event === 'charge.success') {
    const reference = event.data.reference;
    try {
      const verifyRes = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${secret}` }
      });
      if (verifyRes.data.data.status === 'success') {
        // TODO: Update user/plan/payment status in your DB
      }
    } catch (err) {
      res.status(500).send('Verification failed');
      return 
    }
  }
  res.sendStatus(200);
};

export const verifyPayment = async (req: any, res: any) => {
  try {
    const { email, transactionId } = req.body;
    if (!transactionId || !email) {
      res.status(400).json({ message: "Missing payment details" });
      return 
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return 
    }

    user.paymentVerified = true;
    await user.save();

    res.json({ success: true, message: "Payment verified and user updated" });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Failed to verify payment", error: (error as any).message });
  }
};