import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { requestLogger } from './utils/logger';
import routes from './routes/v1';
import errorHandler from './middlewares/errorHandler';
const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

app.use('/api/v1', routes);

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-com backend is running successfully',
  });
});

app.use(errorHandler);

export default app;
