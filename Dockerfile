FROM oven/bun:1 AS builder
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# optional: build if using bundling
# RUN bun build src/index.tsx --outdir dist

# final image, includes everything
FROM oven/bun:1 AS runner
WORKDIR /usr/src/app

# copy everything
COPY --from=builder /usr/src/app ./

EXPOSE 3000

# run app (from script or direct file)
CMD ["bun", "start"]