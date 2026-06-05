import { resolve } from "node:path";
import { defineConfig } from "vite";

const isDailyReportBuild = process.env.BUILD_TARGET === "daily-report";
const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGitHubPagesBuild ? "/SSC.Progess/" : "/",
  publicDir: isDailyReportBuild ? false : "public",
  build: {
    rollupOptions: {
      input: isDailyReportBuild
        ? {
            dailyReport: resolve(process.cwd(), "daily-report.html"),
          }
        : {
            dailyReport: resolve(process.cwd(), "daily-report.html"),
            main: resolve(process.cwd(), "index.html"),
            v2: resolve(process.cwd(), "v2.html"),
            v3: resolve(process.cwd(), "v3.html"),
          },
    },
  },
});
