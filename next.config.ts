import type { NextConfig } from "next";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Experience and destination pictures are served from Cloudinary
  images: {
    remotePatterns: cloudName ? [{ protocol: "https", hostname: "res.cloudinary.com", pathname: `/${cloudName}/**` }] : [],
  },
};

export default nextConfig;
