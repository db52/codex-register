# Codex Register Docker 部署

自动化注册 OpenAI 账号的 Docker 镜像，支持多种邮箱服务、批量注册、代理管理和账号管理。

## 功能特性

- 多邮箱服务支持（Tempmail.lol、Outlook、自定义域名）
- 批量注册（可配置并发数量和间隔时间）
- 代理管理（静态代理、动态代理、代理池）
- 账号管理（Token 刷新、验证、导出）
- Web UI 管理界面

## 快速开始

### 环境要求

- Docker
- Docker Compose

### 部署命令

```bash
# 克隆项目
git clone https://github.com/cnlimiter/codex-register.git
cd codex-register

# 启动服务
docker-compose up -d
```

服务启动后访问 http://localhost:8000

## 配置说明

### 端口映射

默认映射到 `8000` 端口，如需修改：

```yaml
# docker-compose.yml
ports:
  - "8080:8000"  # 改为 8080
```

### 数据持久化

数据存储在 `data` 目录，日志存储在 `logs` 目录。

```yaml
volumes:
  - ./data:/app/data
  - ./logs/app/logs
```

### 代理配置

如需在容器中使用代理：

```yaml
environment:
  - HTTP_PROXY=http://your-proxy:port
  - HTTPS_PROXY=http://your-proxy:port
```

或者在 Web UI 中配置代理。

## 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建
docker-compose build --no-cache

# 查看运行状态
docker-compose ps
```

## 构建镜像

```bash
docker build -t codex-register .
```

## 注意事项

- 首次运行会自动创建 `data/` 目录和 SQLite 数据库
- 所有账号和设置数据存储在 `data/database.db`
- 需要代理才能完成注册（OpenAI 地区限制）
