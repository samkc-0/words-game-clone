# Palabrón

![Palabrón screenshot](https://github.com/user-attachments/assets/0916db3b-ed0b-409b-9007-0b1c6000f537)

Palabrón is a Wordle-style game focused on 5-letter words in Spanish. A lightweight Bun server serves the React front-end and validates guesses against a curated word
list, so players can enjoy a fully Spanish experience with daily puzzles and accent support.

## Prerequisites

- [Bun](https://bun.sh) 1.x (includes the package manager and runtime)
- Optional: Docker & Docker Compose, if you prefer containerized workflows

## Clone & Install

```bash
git clone https://github.com/samkc-0/wordle.git
cd wordle
bun install

## Development

Start the Bun dev server with hot reload:

bun dev

The app is available at http://localhost:3000. Changes to the front-end or server code reload automatically.

## Production Build

Create an optimized build and serve it with the Bun runtime:

bun build ./src/index.html --outdir=dist --sourcemap --target=browser --minify --define:process.env.NODE_ENV='"production"' --env='BUN_PUBLIC_*'
NODE_ENV=production bun start

## Docker

Build and run the project using the provided Dockerfile:

docker build -t palabron .
docker run --rm -p 3000:3000 palabron

For a reverse-proxy setup with Caddy, adjust docker-compose.yml as needed and run:

docker compose up --build

## Roadmap

- Add á/é/í/ó/ú keys to the virtual keyboard (currently type them from a physical keyboard)
- Validate guesses against the word list on the client side before submitting
- Polish the UI/UX
- Expand and refine the Spanish word list
```
