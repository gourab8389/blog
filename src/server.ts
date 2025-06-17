import express from "express";
import dotenv from "dotenv";
import blogRoutes from "./routes/blog.js";
import {createClient} from 'redis'
import { StartCacheConsumer } from "./utils/consumer.js";
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT;

StartCacheConsumer();

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient
.connect()
.then(()=> console.log("Redis client connected successfully"))
.catch(console.error);

app.use(express.json());
app.use(cors());

app.use("/api/v1", blogRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
