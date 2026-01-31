import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import AuthRouter from './routes/AuthRoutes.js';
import ThumbnailRouter from './routes/ThumbnailRoutes.js';
import UserRouter from './routes/UserRoutes.js';

declare module 'express-session' {
  interface SessionData {
    isLoggedIn: boolean;
    userId: string;
  }
}

const app = express();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1️ Connect DB
    await connectDB();
    console.log('MongoDB connected');

    // Middlewares
    app.use(
      cors({
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'https://thumblify-taupe.vercel.app'
        ],
        credentials: true
      })
    );

    app.set('trust proxy', 1);

    app.use(
      session({
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 7,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          path: '/'
        },
        store: MongoStore.create({
          mongoUrl: process.env.MONGODB_URI as string,
          collectionName: 'sessions'
        })
      })
    );

    app.use(express.json());

    // Routes
    app.get('/', (req: Request, res: Response) => {
      res.send('Server is Live!');
    });

    app.use('/api/auth', AuthRouter);
    app.use('/api/thumbnail', ThumbnailRouter);
    app.use('/api/user', UserRouter);

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();