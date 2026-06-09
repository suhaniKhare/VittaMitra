import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server due to connection error:', err);
});
