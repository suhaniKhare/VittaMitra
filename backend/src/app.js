import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ledgerRoutes from './routes/ledgerRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api/ledger', ledgerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'VittaMitra Backend is running',
    timestamp: new Date().toISOString()
  });
});

export default app;
