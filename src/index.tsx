import { serve } from "bun";
import { getDailyWord, validateGuess } from "./palabras.ts";
import index from "./index.html";

function validateInput(input: string) {
  if (input.length !== 5) return false
  const pattern = /^[a-zñáéíóúäëïöüA-ZÑÁÉÍÓÚÄËÏÖÜ]{5}$/
  return pattern.test(input)
}

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
 
    "/api/check": {
      POST: async (req) => {
        const body = await req.json()
        if (body.guess == null || !validateInput(body.guess)) {
          return Response.json({
            "result": false
          })
        }
        return Response.json({
          "result": validateGuess(body.guess),
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
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Server running at ${server.url}`);
