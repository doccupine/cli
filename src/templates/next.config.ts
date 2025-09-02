export const nextConfigTemplate = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
`;
