/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        unoptimized: true
    },
    async rewrites() {
        const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH || "/pnnqyytx6b";
        const storePath = process.env.NEXT_PUBLIC_STORE_PATH || "/stnwqx7b4";

        return [
            {
                source: `${adminPath}/:path*`,
                destination: "/admin/:path*",
            },
            {
                source: `${storePath}/:path*`,
                destination: "/store/:path*",
            },
        ];
    },
};

export default nextConfig;
