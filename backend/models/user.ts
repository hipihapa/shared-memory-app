import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  uid: string; // Firebase UID or your own user ID
  email: string;
  displayName?: string;
  createdAt: Date;
  paymentVerified: boolean;
}

const UserSchema: Schema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String },
  createdAt: { type: Date, default: Date.now },
  paymentVerified: { type: Boolean, default: false }
});

export default mongoose.model<IUser>('User', UserSchema);