/**
 * A UI encaminha /api/* para a jornada-api. Assim o cookie de sessão fica no mesmo
 * domínio da interface (httpOnly, sem CORS).
 */
const API_URL = process.env.API_URL ?? "http://localhost:3333";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
