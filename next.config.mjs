/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // App Router is the default in Next.js 14+. Feature code under `features/`
  // is lazy-loaded via dynamic imports at the route level (Requirement 4.3).
  experimental: {
    // Optimise package imports as shared UI/util barrels grow (task 45.4).
    optimizePackageImports: [],
  },
};

export default nextConfig;
