import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  image: string;
  instagram: string;
  facebook: string;
  linkedin: string;
  bio: string;
}

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access, No auth header",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decodeValue = jwt.verify(
      token,
      process.env.JWT_SEC as string
    ) as JwtPayload;

    if (!decodeValue || !decodeValue.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access, Invalid token",
      });
      return;
    }

    req.user = decodeValue.user;
    next();
  } catch (error) {
    console.log("Jwt verification error", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized access, please login first",
    });
  }
};

