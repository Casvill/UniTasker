/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: process.env.NEXT_PUBLIC_SHOW_DEV_INDICATORS === "false" ? false : {
    buildActivity: true,
    appIsrStatus: true,
  },
}

export default nextConfig
