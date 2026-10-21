# ==============================================================================
# Stage 1: Build da aplicação Frontend (Node 22 Alpine + TypeScript + Vite)
# ==============================================================================
FROM node:22-alpine AS build

WORKDIR /app

# Copia manifestos de pacotes primeiro para aproveitar o cache de camadas do Docker
COPY package.json package-lock.json ./
RUN npm ci

# Copia o restante do código-fonte do frontend
COPY . .

# Variáveis de ambiente de build (injetadas no bundle estático pelo Vite)
ARG VITE_API_URL=/api
ARG VITE_USE_LOCAL_FALLBACK=false

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_USE_LOCAL_FALLBACK=${VITE_USE_LOCAL_FALLBACK}

# Executa checagem de tipos TypeScript (tsc -b) e gera o bundle de produção (vite build)
RUN npm run build

# ==============================================================================
# Stage 2: Servidor Web de Produção e Proxy Reverso (Nginx Alpine)
# ==============================================================================
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="Equipe SIGI/CLAI - IFPB"
LABEL description="Frontend SPA do Sistema Integrado de Gestão Inclusiva (React 19 / Vite / Nginx)"

# Instala wget para healthcheck do container
RUN apk add --no-cache wget

# Filtra o envsubst do Nginx apenas para a variável BACKEND_INTERNAL_URL,
# preservando variáveis nativas do Nginx ($host, $uri, $remote_addr, etc.)
ENV NGINX_ENVSUBST_FILTER=BACKEND_INTERNAL_URL
ENV BACKEND_INTERNAL_URL=http://backend:8080

# Copia o template de configuração do Nginx (SPA + proxy reverso /api)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Copia os arquivos estáticos compilados no estágio de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
