import express from 'express';
import { addComment, deleteComment, getAllBlogs, getComments, GetSavedBlogs, getSingleBlog, SaveBlog } from '../controllers/blog.js';
import { isAuth } from '../middleware/isAuth.js';


const router = express.Router();

router.get("/blog/all", getAllBlogs);
router.get("/blog/:id", getSingleBlog);
router.post("/comment/:id", isAuth, addComment);
router.get("/comment/:id", getComments);
router.delete("/comment/:id", isAuth, deleteComment);
router.post("/save/:blogid", isAuth, SaveBlog);
router.get("/blog/saved/all", isAuth, GetSavedBlogs);

export default router;