/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      // Add OpenAI's domain for processing images from their services if needed
      { hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      // Add your Supabase storage URL if needed
      { hostname: "dselmfiqklamghlanoez.supabase.co" }
    ]
  },
  // Configure server actions to allow larger payloads for image processing
  serverActions: {
    // Increase body size limit to 10MB to accommodate image uploads
    bodySizeLimit: 10 * 1024 * 1024 // 10MB in bytes
  }
}

export default nextConfig