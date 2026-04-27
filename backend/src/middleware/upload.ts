import type multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "../index";

const USE_MOCK_DB = process.env.USE_MOCK_DB === 'true';

function getMulter(): typeof import("multer") {
  const multerModule = require("multer") as typeof import("multer");
  return (multerModule as any).default || multerModule;
}

// File filter
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

function createUpload() {
  const multerInstance = getMulter();

  return multerInstance({
    storage: multerInstance.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter,
  });
}

// Lazily initialize multer so JSON/base64 flows do not block local mock startup.
export const upload = new Proxy({} as ReturnType<typeof createUpload>, {
  get(_target, prop) {
    const instance = createUpload() as any;
    const value = instance[prop as keyof typeof instance];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

// Helper function to upload file to Supabase Storage
export async function uploadToSupabase(
  file: Express.Multer.File,
  folder: string = "uploads"
): Promise<string> {
  // In mock mode, return placeholder URL
  if (USE_MOCK_DB) {
    console.log('[MOCK] Skipping Supabase upload, returning placeholder');
    return `https://via.placeholder.com/150x150?text=${folder}`;
  }

  try {
    const fileExt = path.extname(file.originalname);
    const fileName = `${folder}/${uuidv4()}${fileExt}`;

    const { data, error } = await supabase!.storage
      .from("avatars") // Bucket name - changed from 'dsuc-lab' to 'avatars'
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase!.storage
      .from("avatars")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Helper function to convert base64 to file and upload
export async function uploadBase64ToSupabase(
  base64String: string,
  folder: string = "uploads"
): Promise<string> {
  // In mock mode, return placeholder URL
  if (USE_MOCK_DB) {
    console.log('[MOCK] Skipping base64 Supabase upload, returning placeholder');
    return `https://via.placeholder.com/150x150?text=${folder}`;
  }

  try {
    // Remove data:image/png;base64, prefix if exists
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Detect image type from base64 string
    let ext = ".png";
    if (
      base64String.includes("data:image/jpeg") ||
      base64String.includes("data:image/jpg")
    ) {
      ext = ".jpg";
    } else if (base64String.includes("data:image/gif")) {
      ext = ".gif";
    } else if (base64String.includes("data:image/webp")) {
      ext = ".webp";
    }

    const fileName = `${folder}/${uuidv4()}${ext}`;

    const { data, error } = await supabase!.storage
      .from("avatars") // Changed from 'dsuc-lab' to 'avatars'
      .upload(fileName, buffer, {
        contentType: `image/${ext.replace(".", "")}`,
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase!.storage
      .from("avatars") // Changed from 'dsuc-lab' to 'avatars'
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error("Base64 upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Helper function to upload base64 to ImageBB (bypass Supabase RLS issues)
export async function uploadBase64ToImageBB(
  base64String: string
): Promise<string> {
  // In mock mode, return placeholder URL
  if (USE_MOCK_DB) {
    console.log('[MOCK] Skipping ImageBB upload, returning placeholder');
    return 'https://via.placeholder.com/400x300?text=UploadedImage';
  }

  try {
    // ImageBB API key
    const API_KEY =
      process.env.IMAGEBB_API_KEY || "5c5191a763d20c7fad2bfb62035d5210";

    // Remove data:image/png;base64, prefix if exists
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

    // Create form data
    const formData = new URLSearchParams();
    formData.append("image", base64Data);

    console.log("[ImageBB] Uploading image...");

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result: any = await response.json();

    if (result.success && result.data && result.data.url) {
      console.log("[ImageBB] Upload successful:", result.data.url);
      return result.data.url; // Public URL
    } else {
      console.error("[ImageBB] Upload failed:", result);
      throw new Error(result.error?.message || "Upload failed");
    }
  } catch (error: any) {
    console.error("[ImageBB] Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}
