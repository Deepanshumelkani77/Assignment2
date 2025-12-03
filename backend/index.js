
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');


// Initialize express app
const app = express();

// Start server
const PORT = process.env.PORT || 7000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://deepumelkani123_db_user:IXTsOS2IZeLGDVzE@cluster0.azmpnf4.mongodb.net/?appName=Cluster0");
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
  }
};

// Connect to database
connectDB();



// Import routes
const authRoutes = require('./routes/authRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const userRoutes = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/users', userRoutes);

// Handle 404 routes - use a proper path instead of *
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use(globalErrorHandler);



