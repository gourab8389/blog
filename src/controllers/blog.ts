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
