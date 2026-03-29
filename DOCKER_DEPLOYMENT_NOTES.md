# ai-photo-booth-web-console Docker 部署说明

## 文件说明

### Dockerfile
- **两阶段构建**：
  - 第一阶段：使用 `node:18-alpine` 构建前端应用
  - 第二阶段：使用 `nginx:alpine` 托管静态文件
- **优势**：最终镜像只包含 nginx 和静态文件，体积小、启动快

### nginx.conf
- **Vue History 路由支持**：使用 `try_files` 指令支持前端路由
- **API 反向代理**：将 `/api` 请求代理到 `platform:8089`
- **性能优化**：启用 gzip 压缩和静态资源缓存

---

## 为什么生产环境不依赖 vite.config.js 的 proxy？

### 1. vite.config.js 的 proxy 只在开发环境生效

**原因**：
- Vite 的 `server.proxy` 配置只在开发服务器（`npm run dev`）运行时生效
- 生产环境构建（`npm run build`）只生成静态文件（HTML、CSS、JS），不包含 Vite 开发服务器
- 构建后的静态文件是纯前端资源，无法执行代理逻辑

### 2. 生产环境需要独立的 Web 服务器

**原因**：
- 构建后的静态文件需要 Web 服务器来托管（如 nginx、Apache）
- Web 服务器负责：
  - 提供静态文件服务
  - 处理 API 请求转发
  - 支持前端路由（History 模式）

### 3. nginx 更适合生产环境

**优势**：
- **性能**：nginx 是高性能的 Web 服务器，专门优化用于静态文件服务
- **稳定性**：生产级服务器，经过大量生产环境验证
- **功能**：支持反向代理、负载均衡、缓存等高级功能
- **资源占用**：相比 Node.js 开发服务器，资源占用更少

---

## 为什么 nginx 反代到 platform:8089？

### 1. Docker 容器间通信

**原因**：
- 在 Docker 环境中，服务之间通过**服务名称**进行通信
- `platform` 是 `ai-photo-booth-platform` 服务在 docker-compose 中的服务名称
- `localhost` 在容器内指向容器自身，无法访问其他容器

### 2. 服务发现机制

**Docker 网络**：
- Docker Compose 会创建一个内部网络
- 服务名称自动解析为容器 IP
- 例如：`http://platform:8089` → 自动解析为 platform 容器的 IP:8089

### 3. 与开发环境的区别

**开发环境**：
- 所有服务运行在同一台机器上
- 使用 `localhost` 或 `127.0.0.1` 访问本地服务
- Vite proxy 配置：`target: 'http://localhost:8089'`

**生产环境（Docker）**：
- 每个服务运行在独立的容器中
- 容器有独立的网络命名空间
- nginx 代理配置：`proxy_pass http://platform:8089`

### 4. 前端代码无需修改

**优势**：
- `src/api/http.js` 使用相对路径 `/api/v1`
- 相对路径会根据当前页面的域名和端口自动解析
- 开发环境：`http://localhost:3000/api/v1` → Vite proxy → `http://localhost:8089/api/v1`
- 生产环境：`http://yourdomain.com/api/v1` → nginx proxy → `http://platform:8089/api/v1`
- **无需修改前端代码**，自动适配不同环境

---

## 部署流程

### 1. 构建镜像
```bash
docker build -t ai-photo-booth-web-console .
```

### 2. 运行容器（示例）
```bash
docker run -d \
  -p 80:80 \
  --name web-console \
  --network ai-booth-network \
  ai-photo-booth-web-console
```

### 3. Docker Compose 集成
```yaml
web-console:
  build:
    context: ./ai-photo-booth-web-console
    dockerfile: Dockerfile
  container_name: ai-photo-booth-web-console
  ports:
    - "80:80"
  networks:
    - ai-booth-network
  depends_on:
    - platform
```

---

## 配置说明

### nginx.conf 关键配置

1. **Vue History 路由**：
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
   - 如果请求的文件不存在，返回 `index.html`
   - Vue Router 会接管路由，显示正确的页面

2. **API 反向代理**：
   ```nginx
   location /api {
       proxy_pass http://platform:8089;
   }
   ```
   - 所有 `/api` 开头的请求转发到 platform 服务
   - 保持请求头信息，确保认证等功能正常

3. **静态资源缓存**：
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```
   - 静态资源缓存 1 年
   - 提升页面加载速度

---

## 总结

| 环境 | Web 服务器 | API 代理 | 说明 |
|------|-----------|---------|------|
| 开发环境 | Vite Dev Server | Vite Proxy | `vite.config.js` 中的 proxy 配置 |
| 生产环境 | Nginx | Nginx Proxy | `nginx.conf` 中的反向代理配置 |

**关键点**：
- ✅ 前端代码使用相对路径，无需修改
- ✅ 开发环境使用 Vite proxy
- ✅ 生产环境使用 nginx 反向代理
- ✅ Docker 环境使用服务名称（`platform`）而非 `localhost`
