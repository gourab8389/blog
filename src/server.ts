import express from "express";
import dotenv from "dotenv";
import blogRoutes from "./routes/blog.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT;

app.use(express.json());

app.use("/api/v1", blogRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
