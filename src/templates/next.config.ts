export const nextConfigTemplate = `import type { NextConfig } from "next";
const path = require("path");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "./"),
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ["lucide-react"],
};

export default nextConfig;
`;
