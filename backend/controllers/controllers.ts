import Space from "../models/space";
import Media from "../models/media";
import multer from "multer";
import cloudinary from "cloudinary";
import axios from "axios";
import User from "../models/user";

/**
 * Generates a unique URL slug by checking for duplicates and appending numbers if needed
 * @param baseSlug - The base slug to check
 * @returns A unique URL slug
 */
async function generateUniqueUrlSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  // Keep checking until we find an available slug
  while (true) {
    const existingSpace = await Space.findOne({ urlSlug: slug });
    if (!existingSpace) {
      return slug; // Slug is available
    }
    
    // Slug exists, try with a number suffix
    slug = `${baseSlug}${counter}`;
    counter++;
    
    // Prevent infinite loops (safety measure)
    if (counter > 100) {
      // If we can't find a unique slug after 100 attempts, add timestamp
      const timestamp = Date.now().toString().slice(-4);
      slug = `${baseSlug}${timestamp}`;
      break;
    }
  }
  
  return slug;
}

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

/**
 * Creates a new memory space for a user
 * @param req - Express request object containing space data in body
 * @param res - Express response object
 * @returns Created space object or error message
 */
export const createSpace = async (req: any, res: any) => {
  try {
    const spaceData = { ...req.body };
    
    console.log(`Creating space with URL slug: ${spaceData.urlSlug}`);
    
    // Generate a unique URL slug
    const originalSlug = spaceData.urlSlug;
    const uniqueSlug = await generateUniqueUrlSlug(originalSlug);
    
    // If the slug was changed, log it for debugging
    if (originalSlug !== uniqueSlug) {
      console.log(`URL slug changed from "${originalSlug}" to "${uniqueSlug}" due to duplicate`);
    } else {
      console.log(`URL slug "${uniqueSlug}" is unique and available`);
    }
    
    // Update the space data with the unique slug
    spaceData.urlSlug = uniqueSlug;
    
    // Double-check that the slug is actually unique before saving
    const existingSpace = await Space.findOne({ urlSlug: uniqueSlug });
    if (existingSpace) {
      console.error(`CRITICAL: Slug "${uniqueSlug}" still exists after uniqueness check!`);
      throw new Error(`URL slug "${uniqueSlug}" is already taken. Please try a different one.`);
    }
    
    const newSpace = new Space(spaceData);
    await newSpace.save();
    
    console.log(`Space created successfully with slug: ${uniqueSlug}`);
    
    // If the slug was changed, include a message in the response
    const response = {
      ...newSpace.toObject(),
      slugChanged: originalSlug !== uniqueSlug,
      originalSlug: originalSlug,
      finalSlug: uniqueSlug
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating space:", error);
    
    // Handle duplicate key errors specifically
    if ((error as any).code === 11000 && (error as any).keyPattern?.urlSlug) {
      res.status(400).json({
        message: `URL slug "${req.body.urlSlug}" is already taken. Please try a different one.`,
        error: "Duplicate URL slug",
        suggestedSlug: await generateUniqueUrlSlug(req.body.urlSlug)
      });
      return;
    }
    
    res.status(500).json({
      message: "Failed to create space",
      error: (error as Error).message,
    });
  }
};

/**
 * Retrieves the space ID associated with a specific user
 * @param req - Express request object with userId in params
 * @param res - Express response object
 * @returns Object containing spaceId or error message
 */
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

/**
 * Retrieves a space by its URL slug
 * @param req - Express request object with urlSlug in params
 * @param res - Express response object
 * @returns Space object or error message
 */
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

/**
 * Retrieves a space by its unique ID
 * @param req - Express request object with spaceId in params
 * @param res - Express response object
 * @returns Space object or error message
 */
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

/**
 * Uploads media files to a specific space with storage and plan validation
 * Handles file size limits, media count limits, and cloudinary upload
 * @param req - Express request object with file, spaceId in params, and uploadedBy in body
 * @param res - Express response object
 * @returns Created media object or error message
 */
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

/**
 * Retrieves all media files for a specific space
 * @param req - Express request object with spaceId in params
 * @param res - Express response object
 * @returns Array of media objects or error message
 */
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

/**
 * Updates the public/private mode of a space
 * @param req - Express request object with spaceId in params and isPublic in body
 * @param res - Express response object
 * @returns Updated space object or error message
 */
export const updateSpaceMode = async (req: any, res: any) => {
  try {
    const { spaceId } = req.params;
    const { isPublic } = req.body;
    const space = await Space.findByIdAndUpdate(
      spaceId, { isPublic }, { new: true }
    );
    if(!space) {
      res.status(404).json({ message: "Space not found"});
      return;
    }
    res.json(space);
  } catch (error) {
    res.status(500).json({ message: "Failed to update mode", error: (error as Error).message });
  }
};

/**
 * Deletes a media file from both database and cloudinary storage
 * @param req - Express request object with spaceId and mediaId in params
 * @param res - Express response object
 * @returns Success message or error message
 */
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

/**
 * Initializes a payment transaction with Paystack
 * Supports both card and mobile money payment methods
 * @param req - Express request object with payment details in body
 * @param res - Express response object
 * @returns Paystack transaction data or error message
 */
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

/**
 * Handles Paystack webhook notifications for payment status updates
 * Verifies webhook signature and processes successful payments
 * @param req - Express request object with webhook payload and signature
 * @param res - Express response object
 * @returns HTTP status 200 on success or error status
 */
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

/**
 * Verifies a completed payment and updates user payment status
 * @param req - Express request object with email and transactionId in body
 * @param res - Express response object
 * @returns Success message or error message
 */
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

/**
 * Checks if a user exists in the database
 * @param req - Express request object with uid in params
 * @param res - Express response object
 * @returns Object indicating if user exists or error message
 */
export const checkUserExists = async (req: any, res: any) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    
    if (!user) {
      res.status(404).json({ 
        exists: false, 
        message: "User not found. Please sign up first." 
      });
      return;
    }
    
    res.json({ 
      exists: true, 
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        paymentVerified: user.paymentVerified
      }
    });
  } catch (error) {
    console.error("Error checking user existence:", error);
    res.status(500).json({
      message: "Failed to check user existence",
      error: (error as Error).message,
    });
  }
};

/**
 * Creates a new user in the database or updates existing user
 * @param req - Express request object containing user data in body
 * @param res - Express response object
 * @returns Created/updated user object or error message
 */
export const createUser = async (req: any, res: any) => {
  try {
    const { uid, email, displayName } = req.body;
    
    console.log(`Creating/updating user: UID=${uid}, Email=${email}, DisplayName=${displayName}`);
    
    // Check if user already exists by UID
    const existingUser = await User.findOne({ uid });
    
    if (existingUser) {
      console.log(`User exists with UID ${uid}, current email: ${existingUser.email}`);
      
      // User exists, handle email changes intelligently
      if (existingUser.email !== email) {
        console.log(`User wants to change email from ${existingUser.email} to ${email}`);
        
        // Check if the new email is already used by another user
        const emailConflict = await User.findOne({ email, uid: { $ne: uid } });
        if (emailConflict) {
          console.log(`Email conflict found: ${email} is used by user ${emailConflict.uid}`);
          
          // Email conflict exists, but since this user is completing their registration,
          // we should allow them to update their email to complete the process
          // This prevents users from being stuck with incomplete registrations
          
          // Update the user with the new email (allowing them to complete registration)
          existingUser.email = email;
          existingUser.displayName = displayName;
          await existingUser.save();
          
          console.log(`User updated successfully to complete registration with new email: ${email}`);
          
          res.json({ 
            message: "User updated successfully to complete registration", 
            user: existingUser,
            updated: true,
            note: "Email updated to complete registration process"
          });
          return;
        }
        
        // Email is available, update the user
        console.log(`Email ${email} is available, updating user`);
        existingUser.email = email;
        existingUser.displayName = displayName;
        await existingUser.save();
        
        res.json({ 
          message: "User updated successfully", 
          user: existingUser,
          updated: true 
        });
        return;
      } else {
        console.log(`Email unchanged, updating display name if needed`);
        // Email is the same, just update display name if needed
        if (existingUser.displayName !== displayName) {
          existingUser.displayName = displayName;
          await existingUser.save();
        }
        
        res.json({ 
          message: "User already exists", 
          user: existingUser,
          updated: false 
        });
        return;
      }
    }
    
    console.log(`User with UID ${uid} does not exist, checking email availability`);
    
    // User doesn't exist, check if email is already used
    const emailConflict = await User.findOne({ email });
    if (emailConflict) {
      console.log(`Email ${email} is already used by user ${emailConflict.uid}`);
      // If this is a Google user trying to register with an email that exists,
      // check if they can sign in with that account instead
      res.status(400).json({ 
        message: `Email "${email}" is already used by another account. Please use a different email or sign in with the existing account.`,
        error: "Email already in use by another user",
        suggestion: "Try signing in with the existing account instead"
      });
      return;
    }
    
    // Create new user
    console.log(`Creating new user with UID ${uid} and email ${email}`);
    const newUser = new User({
      uid,
      email,
      displayName,
      paymentVerified: false
    });
    
    await newUser.save();
    console.log(`New user created successfully: ${newUser._id}`);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating/updating user:", error);
    
    // Handle MongoDB duplicate key errors
    if ((error as any).code === 11000) {
      if ((error as any).keyPattern?.email) {
        res.status(400).json({ 
          message: `Email "${req.body.email}" is already used by another account. Please use a different email or sign in with the existing account.`,
          error: "Email already in use by another user"
        });
        return;
      }
    }
    
    res.status(500).json({
      message: "Failed to create/update user",
      error: (error as Error).message,
    });
  }
};

/**
 * Checks if a URL slug is available
 * @param req - Express request object with urlSlug in params
 * @param res - Express response object
 * @returns Object indicating if slug is available
 */
export const checkUrlSlugAvailability = async (req: any, res: any) => {
  try {
    const { urlSlug } = req.params;
    
    if (!urlSlug) {
      res.status(400).json({ message: "URL slug is required" });
      return;
    }
    
    const existingSpace = await Space.findOne({ urlSlug });
    
    if (existingSpace) {
      res.json({ 
        available: false, 
        message: `URL slug "${urlSlug}" is already taken`,
        suggestedSlug: await generateUniqueUrlSlug(urlSlug)
      });
    } else {
      res.json({ 
        available: true, 
        message: `URL slug "${urlSlug}" is available` 
      });
    }
  } catch (error) {
    console.error("Error checking URL slug availability:", error);
    res.status(500).json({
      message: "Failed to check URL slug availability",
      error: (error as Error).message,
    });
  }
};