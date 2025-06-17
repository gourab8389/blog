import { sql } from "../utils/db.js";
import { TryCatch } from "../utils/try-catch.js";
import axios from "axios";
// import dotenv from "dotenv";

// dotenv.config();

export const getAllBlogs = TryCatch(async (req, res) => {
  const { searchQuery, category } = req.query;
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
  } else {
    blogs = await sql`
        SELECT * FROM blogs ORDER BY created_at DESC
        `;
  }

  res.json({
    status: true,
    message: "Blogs fetched successfully",
    blogs: blogs,
  });
});

export const getSingleBlog = TryCatch(async (req, res) => {
  const { id } = req.params;

  const blog = await sql`
        SELECT * FROM blogs WHERE id = ${id}
        `;

  const { data } = await axios.get(
    `${process.env.USER_SERVICE}/api/v1/user/${blog[0].author}`
  );

  res.json({
    status: true,
    message: "Blog fetched successfully",
    blog: {
      blog: blog[0],
      author: data,
    },
  });
});
