import mongoose, { Document, Schema } from 'mongoose';

interface ISpace extends Document {
  urlSlug: string;
  userId: string;
  firstName: string;
  lastName: string;
  partnerFirstName: string;
  partnerLastName: string;
  eventDate: Date;
  eventType: String;
  isPublic: boolean;
  createdAt: Date;
}

const SpaceSchema: Schema = new mongoose.Schema({
  urlSlug: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  partnerFirstName: { type: String, required: true },
  partnerLastName: { type: String, required: true },
  eventDate: { type: Date, required: true },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now } 
});

export default mongoose.model<ISpace>('Space', SpaceSchema);