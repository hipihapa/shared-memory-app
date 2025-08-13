import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

import spaceRoutes from './routes/routes';
import userRoutes from './routes/userRoutes';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/spaces', spaceRoutes);
app.use('/api/user', userRoutes);

// Start the server
app.listen(PORT, () => {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI || '')
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('MongoDB connection error:', error));
    
  console.log(`Server running on port ${PORT}`);
});
