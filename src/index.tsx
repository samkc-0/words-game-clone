import { serve } from "bun";
import { getDailyWord } from "./palabras.ts";
import index from "./index.html";


const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/daily": {
      async GET(req) {
        return Response.json({
          word: getDailyWord(),
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
