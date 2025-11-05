FROM node:18-alpine

# Install bash and netcat for waiting for the DB
RUN apk add --no-cache bash netcat-openbsd

WORKDIR /app

# Install dependencies (including dev deps so we can run prisma migrate inside the container)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Create unprivileged user
RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app
USER app

EXPOSE 4000

# Wait for DB to be available, run migrations and start app
CMD ["sh","-c","until nc -z db 5432; do echo 'waiting for db'; sleep 1; done; npx prisma migrate deploy --schema=prisma/schema.prisma && node index.js"]