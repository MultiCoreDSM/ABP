# Imagem da aplicação: API Express que também serve o front-end (RNF07, RP05).
# Build a partir da raiz do repositório (contexto "."), como faz o compose.yaml:
#   docker compose up -d --build
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Mesma estrutura do repositório: server.js serve ../../FrontEnd e ../../assets
# a partir de backend/src, então as três pastas ficam lado a lado em /app.
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY backend/src ./backend/src
COPY FrontEnd ./FrontEnd
COPY assets ./assets

# Não roda como root dentro do container
USER node
WORKDIR /app/backend
EXPOSE 3001

# As variáveis (banco e JWT_SECRET) vêm do compose; por isso não usa o "npm start",
# que lê o arquivo ../.env da máquina.
CMD ["node", "src/server.js"]
