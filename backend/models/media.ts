import mongoose, { Document, Schema } from 'mongoose';

interface IMedia extends Document {
  spaceId: mongoose.Schema.Types.ObjectId;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
}

const MediaSchema: Schema = new mongoose.Schema({
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Space', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  uploadedBy: { type: String, default: 'Guest' },
  uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMedia>('Media', MediaSchema);