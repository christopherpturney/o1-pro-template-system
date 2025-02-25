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
  // Configure experimental features including server actions body size
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  // Add transpilation for formdata-node package
  transpilePackages: ['formdata-node']
}

export default nextConfig