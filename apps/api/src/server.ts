import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { router as authRouter } from './routes/auth';
import { router as membersRouter } from './routes/members';
import { router as importRouter } from './routes/import-v1';
import { router as termsRouter } from './routes/terms';
import { router as teamsRouter } from './routes/teams';
import { HttpError } from './utils/errors';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/members', membersRouter);
app.use('/import', importRouter);
app.use('/terms', termsRouter);
app.use('/', teamsRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err instanceof HttpError ? err.status : 500;
  const body =
    err instanceof HttpError
      ? { message: err.message, code: err.code, details: err.details }
      : { message: 'Internal Server Error' };
  res.status(status).json(body);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
