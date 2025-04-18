// add express

import express from 'express';
import cors from 'cors';
import { PORT } from './config.js';

import userRoutes from "./routes/userRoutes/userRoutes.js";
import campaignRoutes from "./routes/campaignRoutes/campaignRoute.js";
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';

const app = express();


app.use(cors())
app.use(express.json());

app.use('/api/v1/users',userRoutes);
app.use('/api/v1/campaigns',campaignRoutes);

app.use(notFound);
app.use(errorHandler);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});