/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "localhost" }]
  },
  api: {
    bodyParser: {
      sizeLimit: "10mb" // Optional: Sets API route limit to 10MB
    }
  }
}

export default nextConfig