import express from 'express';
import { getAllBlogs } from '../controllers/blog.js';


const router = express.Router();

router.get("/blog/all", getAllBlogs);

export default router;