import { sql } from "../utils/db.js";
import { TryCatch } from "../utils/try-catch.js";

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
        
        if (blog.length === 0) {
          res.status(404).json({
            status: false,
            message: "Blog not found",
          });
          return;
        }
        
        res.json({
        status: true,
        message: "Blog fetched successfully",
        blog: blog[0],
        });
})
