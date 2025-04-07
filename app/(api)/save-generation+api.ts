import { promises as fs } from "fs";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";
import { router } from "expo-router";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const POST = async (req: Request) => {
  try {
    const { image, name, clerkId } = await req.json();

    if (!image || !name || !clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = image.split(";base64,").pop();
    const imageBuffer = Buffer.from(base64Data, "base64");

    // Find user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        savedGenerations: true,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    if (user?.plan === "FREE" && user?.savedGenerations.length == 3) {
      router.push("/(root)/(no-tabs)/subscribe");
      return;
    }
    // Upload to Cloudinary
    const cloudinaryResponse: any = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "saved-generations" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(imageBuffer);
    });

    // Save to database
    const savedGeneration = await prisma.savedGenerations.create({
      data: {
        userId: user.id,
        imageUrl: cloudinaryResponse.secure_url,
        name: name,
      },
    });

    return Response.json({ data: savedGeneration }, { status: 201 });
  } catch (error) {
    console.error("Error saving generation:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
