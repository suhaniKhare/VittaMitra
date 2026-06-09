import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Routes Mounting
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'Auth Server is running successfully',
    timestamp: new Date().toISOString()
  });
});

// Database connection & Server Startup logic with auto-kill port conflicts handler
await connectDB();

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Auth backend service running at http://localhost:${PORT}`);
    console.log(`   POST /api/auth/signup  → Register new user`);
    console.log(`   POST /api/auth/login   → User authentication`);
    console.log(`   GET  /api/auth/me      → Fetch current profile (Protected)\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} is currently in use. Attempting to clear the port automatically...`);
      exec(`npx kill-port ${PORT}`, (error) => {
        if (error) {
          console.error(`Failed to automatically free port ${PORT}:`, error.message);
          process.exit(1);
        }
        console.log(`Port ${PORT} cleared. Restarting the server...`);
        setTimeout(startServer, 1000);
      });
    }
  });
};

startServer();
