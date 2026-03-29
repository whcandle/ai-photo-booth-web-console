# 构建阶段：使用 Node.js 构建前端应用
FROM node:18-alpine AS build

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 运行阶段：使用 Nginx 托管静态文件
FROM nginx:alpine

# 从构建阶段复制构建产物到 nginx 静态文件目录
COPY --from=build /app/dist /usr/share/nginx/html

# 复制 nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
