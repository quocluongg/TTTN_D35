# 🚀 Hướng Dẫn Deploy Hệ Thống Lên Microsoft Azure

Tài liệu hướng dẫn triển khai toàn bộ hệ thống E-commerce AI (**Frontend Next.js**, **Backend Spring Boot**, **AI Engine FastAPI** và **Redis**) lên hạ tầng **Microsoft Azure**.

---

## 🏗️ Kiến Trúc Hệ Thống Deploy

```
                    ┌─────────────────────────┐
                    │      Internet (User)    │
                    └────────────┬────────────┘
                                 │ HTTP/HTTPS (Port 80/443)
                                 ▼
                    ┌─────────────────────────┐
                    │  Nginx Reverse Proxy    │
                    └────┬────────┬───────┬───┘
                         │        │       │
      ┌──────────────────┘        │       └──────────────────┐
      │ /                         │ /api                     │ /ai
      ▼                           ▼                          ▼
┌─────────────┐           ┌──────────────┐           ┌──────────────┐
│  Frontend   │           │   Backend    │           │  AI Engine   │
│  (Next.js)  │           │ (Spring Boot)│           │  (FastAPI)   │
│  Port 3000  │           │  Port 8080   │           │  Port 8000   │
└─────────────┘           └───────┬──────┘           └──────────────┘
                                  │
                                  ▼
                          ┌──────────────┐
                          │    Redis     │
                          │  Port 6379   │
                          └──────────────┘
```

---

## 📌 Phương Án 1: Triển Khai Qua Azure VM (Docker Compose) - *Khuyên Dùng Cho Đồ Án / Tối Ưu Chi Phí*

Phương án này sử dụng 1 máy chủ ảo **Azure Ubuntu VM (Standard_B2ms / Standard_B4ms)** để chạy tất cả các container thông qua Docker Compose. Rất tiết kiệm chi phí (dùng được Azure $100 Student Credit / Azure Pass).

### Bước 1: Khởi Tạo Azure Virtual Machine (VM)
1. Truy cập [Azure Portal](https://portal.azure.com/).
2. Tạo mới **Virtual Machine**:
   - **OS**: Ubuntu Server 22.04 LTS - x64 Gen2.
   - **Size**: `Standard_B2ms` (2 vCPU, 8 GiB RAM) hoặc `Standard_B4ms` (để AI Engine nạp PhoBERT/PyTorch mượt mà).
   - **Authentication type**: SSH public key (hoặc Password).
   - **Inbound port rules**: Mở các cổng `HTTP (80)`, `HTTPS (443)`, `SSH (22)`.

### Bước 2: Cài Đặt Docker & Docker Compose Trên VM
Kết nối SSH vào máy chủ Azure VM và chạy script cài đặt:

```bash
# Update hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
sudo apt install -y docker.io docker-compose-plugin git

# Thêm user vào group docker
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra Docker
docker --version
```

### Bước 3: Chuẩn Bị Dockerfile Cho Các Services

#### 1. Backend (`backend/Dockerfile`)
```dockerfile
# Stage 1: Build JAR
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
COPY . .
RUN gradle bootJar --no-daemon -x test

# Stage 2: Run App
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 2. Frontend (`frontend/Dockerfile`)
```dockerfile
# Stage 1: Dependencies & Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### 3. AI Engine (`ai-engine/Dockerfile`)
```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Bước 4: Tạo File `docker-compose.prod.yml` Tại Thư Mục Gốc Repo

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: shopwise-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: shopwise-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_REDIS_HOST=redis
      - SPRING_REDIS_PORT=6379
      - AI_ENGINE_URL=http://ai-engine:8000
    depends_on:
      - redis

  ai-engine:
    build:
      context: ./ai-engine
      dockerfile: Dockerfile
    container_name: shopwise-ai-engine
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - ./ai-engine/.env

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: shopwise-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://<YOUR_AZURE_VM_IP>:8080
      - NEXT_PUBLIC_AI_URL=http://<YOUR_AZURE_VM_IP>:8000
    depends_on:
      - backend
      - ai-engine

volumes:
  redis_data:
```

### Bước 5: Chạy Hệ Thống Trên VM

```bash
# Clone source code về VM
git clone <URL_REPO_CUA_BAN>
cd TTTN_D35

# Build và chạy ngầm toàn bộ container
docker compose -f docker-compose.prod.yml up -d --build

# Kiểm tra trạng thái các container
docker compose -f docker-compose.prod.yml ps
```

---

## 📌 Phương Án 2: Triển Khai Qua Azure Container Apps (Cloud Native)

Phương án này chạy microservices độc lập trên Azure Container Apps (ACA) - tự động auto-scale và có 180,000 vCPU-seconds miễn phí mỗi tháng.

### 1. Chuẩn bị Azure Container Registry (ACR)
```bash
# Đăng nhập Azure CLI
az login

# Tạo Resource Group
az group create --name shopwise-rg --location southeastasia

# Tạo Container Registry
az acr create --resource-group shopwise-rg --name shopwiseacr --sku Basic

# Đăng nhập ACR
az acr login --name shopwiseacr
```

### 2. Build & Push Images Lên ACR
```bash
# Build & Push Backend
docker build -t shopwiseacr.azurecr.io/backend:v1 ./backend
docker push shopwiseacr.azurecr.io/backend:v1

# Build & Push AI Engine
docker build -t shopwiseacr.azurecr.io/ai-engine:v1 ./ai-engine
docker push shopwiseacr.azurecr.io/ai-engine:v1

# Build & Push Frontend
docker build -t shopwiseacr.azurecr.io/frontend:v1 ./frontend
docker push shopwiseacr.azurecr.io/frontend:v1
```

### 3. Deploy Lên Azure Container Apps
```bash
# Tạo môi trường ACA
az containerapp env create --name shopwise-env --resource-group shopwise-rg --location southeastasia

# Deploy AI Engine (Cấp 2.0 CPU, 4.0Gi RAM cho PyTorch/PhoBERT)
az containerapp create \
  --name ai-engine \
  --resource-group shopwise-rg \
  --environment shopwise-env \
  --image shopwiseacr.azurecr.io/ai-engine:v1 \
  --target-port 8000 \
  --ingress external \
  --cpu 2.0 --memory 4.0Gi

# Deploy Backend Spring Boot
az containerapp create \
  --name backend \
  --resource-group shopwise-rg \
  --environment shopwise-env \
  --image shopwiseacr.azurecr.io/backend:v1 \
  --target-port 8080 \
  --ingress external \
  --cpu 1.0 --memory 2.0Gi

# Deploy Frontend Next.js (Hoặc có thể deploy lên Vercel / Azure Static Web Apps)
az containerapp create \
  --name frontend \
  --resource-group shopwise-rg \
  --environment shopwise-env \
  --image shopwiseacr.azurecr.io/frontend:v1 \
  --target-port 3000 \
  --ingress external \
  --cpu 0.5 --memory 1.0Gi
```

---

## 🔒 Cấu Hình Firewall / Network Security Group (NSG) Trên Azure

Nếu dùng Azure VM, hãy đảm bảo cấu hình **Inbound Port Rules** trong phần **Networking** của VM:

| Priority | Name | Port | Protocol | Source | Action | Destination |
|---|---|---|---|---|---|---|
| 100 | Allow-SSH | 22 | TCP | Any | Allow | Any |
| 200 | Allow-HTTP | 80 | TCP | Any | Allow | Any |
| 300 | Allow-HTTPS | 443 | TCP | Any | Allow | Any |
| 400 | Allow-Backend | 8080 | TCP | Any | Allow | Any |
| 500 | Allow-AIEngine | 8000 | TCP | Any | Allow | Any |
| 600 | Allow-Frontend | 3000 | TCP | Any | Allow | Any |

---

## 🛠️ Troubleshooting & Bảo Trì

- **Xem log container trên VM**:
  ```bash
  docker logs -f shopwise-backend
  docker logs -f shopwise-ai-engine
  docker logs -f shopwise-frontend
  ```
- **Kiểm tra bộ nhớ RAM đang dùng**:
  ```bash
  docker stats
  ```
- **Khởi động lại toàn bộ hệ thống**:
  ```bash
  docker compose -f docker-compose.prod.yml restart
  ```
