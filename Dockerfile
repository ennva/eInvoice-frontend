# Build stage
FROM node:20-bullseye-slim AS build
WORKDIR /app

# Install build deps for native modules (Debian-based)
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		python3 \
		make \
		g++ \
		build-essential \
	&& rm -rf /var/lib/apt/lists/*

# Allow injecting backend URL at build time (default to docker network name)
ARG REACT_APP_BACKEND_URL=http://backend:8000
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}

# Use npm by default; copy lockfiles if present to improve caching
COPY package.json ./
COPY package-lock.json* ./
COPY yarn.lock* ./

# Use Yarn (project declares yarn in `packageManager`). Enable Corepack and prepare Yarn
ENV NODE_ENV=development
RUN set -eux \
	&& whoami && id \
	&& node -v && npm -v \
	&& corepack enable \
	&& corepack prepare yarn@1.22.22 --activate \
	&& yarn --version \
	&& yarn install --frozen-lockfile --non-interactive --network-concurrency 1 --production=false 2>&1 | tee /tmp/yarn-install.log \
	&& if [ ! -x ./node_modules/.bin/craco ]; then yarn add @craco/craco@^7.1.0 --dev --non-interactive; fi \
	&& ls -la node_modules/.bin | sed -n '1,200p'

# Copy source and build (CRA reads REACT_APP_* env vars at build time)
COPY . .
# Build in production mode (CRA reads NODE_ENV at build time)
ENV NODE_ENV=production
RUN ./node_modules/.bin/craco build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html

# Use custom config instead of the default
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
