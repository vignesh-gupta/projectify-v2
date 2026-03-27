/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
        pathname: "/s2/favicons/**",
      },
      {
        protocol: "https",
        hostname: "brave-bullfrog-153.eu-west-1.convex.cloud",
        pathname: "**",
      },
    ],
  },
}

export default nextConfig
