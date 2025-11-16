import express from 'express';
import cors from 'cors';
import { convertApiRoute } from './api/convert.ts';
const app = express();
const PORT = process.env.PORT || 3001;
import dotenv from "dotenv";
dotenv.config();


app.use(cors());
app.use(express.json());

// API routes
app.use('/api', convertApiRoute);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

