import { AuthenticatedRequest } from "../middleware/isAuth.js";
import { redisClient } from "../server.js";
import { sql } from "../utils/db.js";
import { TryCatch } from "../utils/try-catch.js";
import axios from "axios";

export const getAllBlogs = TryCatch(async (req, res) => {
  const { searchQuery = "", category = "" } = req.query;

  const cachekey = `blogs:${searchQuery}:${category}`;

  const cached = await redisClient.get(cachekey);

  if (cached) {
    console.log("serving from cache");
    res.json({
      status: true,
      message: "Blogs fetched successfully from cache",
      blogs: JSON.parse(cached),
    });
    return;
  }

  let blogs;

  if (searchQuery && category) {
    blogs = await sql`
        SELECT * FROM blogs
        WHERE (title ILIKE ${"%" + searchQuery + "%"} OR description ILIKE ${
      "%" + searchQuery + "%"
    }) AND 
        category = ${category} ORDER BY created_at DESC
        `;
  } else if (searchQuery) {
    blogs = await sql`
        SELECT * FROM blogs
        WHERE title ILIKE ${"%" + searchQuery + "%"} OR description ILIKE ${
      "%" + searchQuery + "%"
    } 
        ORDER BY created_at DESC
        `;
  } else if (category) {
    blogs = await sql`
                SELECT * FROM blogs
                WHERE category = ${category} ORDER BY created_at DESC
                `;
  } else {
    blogs = await sql`
        SELECT * FROM blogs ORDER BY created_at DESC
        `;
  }

  console.log("serving from db");

  await redisClient.set(cachekey, JSON.stringify(blogs), {
    EX: 60 * 60,
    NX: true,
  });

  res.json({
    status: true,
    message: "Blogs fetched successfully",
    blogs: blogs,
  });
});

export const getSingleBlog = TryCatch(async (req, res) => {
  const { id } = req.params;

  const cachekey = `blog:${id}`;
  const cached = await redisClient.get(cachekey);

  if (cached) {
    console.log("serving from cache");
    res.json({
      status: true,
      message: "Blog fetched successfully from cache",
      resposeData: JSON.parse(cached),
    });
    return;
  }

  const blog = await sql`
        SELECT * FROM blogs WHERE id = ${id}
        `;

  if (blog.length === 0) {
    res.status(404).json({
      status: false,
      message: "Blog not found",
    });
    return;
  }

  const { data } = await axios.get(
    `${process.env.USER_SERVICE}/api/v1/user/${blog[0].author}`
  );

  const resposeData = {
    blog: blog[0],
    author: data.user,
  };

  await redisClient.set(cachekey, JSON.stringify({resposeData: resposeData}), {
    EX: 60 * 60,
    NX: true,
  });

  res.json({
    status: true,
    message: "Blog fetched successfully",
    resposeData,
  });
});

export const addComment = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id: blogId } = req.params;
  const { comment } = req.body;

  if (!comment) {
    res.status(400).json({
      status: false,
      message: "Comment is required",
    });
    return;
  }

  await sql`INSERT INTO comments (comment, blogid, userid, username) VALUES (${comment}, ${blogId}, ${req.user?._id}, ${req.user?.name})
  RETURNING *`;

  res.json({
    status: true,
    message: "Comment added successfully",
  });
});

export const getComments = TryCatch(async (req, res) => {
  const { id } = req.params;

  const comments = await sql`
        SELECT * FROM comments WHERE blogid = ${id} ORDER BY created_at DESC
        `;

  res.json({
    status: true,
    message: "Comments fetched successfully",
    comments,
  });
});

export const deleteComment = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({
      status: false,
      message: "Unauthorized access",
    });
    return;
  }

  const comment = await sql`
        SELECT * FROM comments WHERE id = ${id} AND userid = ${req.user._id}
        `;

  if (comment.length === 0) {
    res.status(404).json({
      status: false,
      message: "Comment not found or you are not authorized to delete it",
    });
    return;
  }

  await sql`DELETE FROM comments WHERE id = ${id}`;

  res.json({
    status: true,
    message: "Comment deleted successfully",
  });
});

export const SaveBlog = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { blogid } = req.params;
  const userId = req.user?._id;

  if (!blogid) {
    res.status(400).json({
      status: false,
      message: "Blog ID is required",
    });
    return;
  }

  if (!userId) {
    res.status(401).json({
      status: false,
      message: "Unauthorized access",
    });
    return;
  }

  const existingBlog = await sql`
        SELECT * FROM saveblogs WHERE blogid = ${blogid} AND userid = ${userId}
        `;
  if(existingBlog.length === 0){
    await sql`INSERT INTO saveblogs (userid, blogid) VALUES (${userId}, ${blogid})`;
    res.json({
      status: true,
      message: "Blog saved successfully",
    });
  }else{
    await sql`DELETE FROM saveblogs WHERE blogid = ${blogid} AND userid = ${userId}`;
    res.json({
      status: true,
      message: "Blog unsaved successfully",
    });
  }
});

export const GetSavedBlogs = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(401).json({
      status: false,
      message: "Unauthorized access",
    });
    return;
  }

  const savedBlogs = await sql`
        SELECT * FROM saveblogs WHERE userid = ${userId}
        `;

  if (savedBlogs.length === 0) {
    res.json({
      status: true,
      message: "No saved blogs found",
      blogs: [],
    });
    return;
  }

const blogIds = savedBlogs.map(blog => blog.blogid);
const blogs = await sql`
    SELECT * FROM blogs WHERE id = ANY(${blogIds})
`;

  res.json({
    status: true,
    message: "Saved blogs fetched successfully",
    blogs,
  });
});
