/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  // Proxy para o backend NestJS — browser faz request na mesma origem (sem CORS)
  // e o servidor Next.js encaminha para localhost:8080.
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8080"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
