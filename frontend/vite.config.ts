import { defineConfig } from "vite";

export default defineConfig({
  preview: {
    host: true,
    // Railway assigns the public port via $PORT; reading it here (rather
    // than in the npm script) keeps `npm run start` portable — Windows'
    // cmd.exe doesn't expand $PORT the way Railway's Linux shell does.
    port: Number(process.env.PORT) || 4173,
    // Railway's public domain isn't known ahead of time, so allow any host
    // (the deployment itself is already behind Railway's HTTPS proxy).
    allowedHosts: true,
  },
});
