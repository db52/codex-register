# Codex Register Docker 部署

自动化注册 OpenAI Codex 账号的 Web UI 系统。

## 功能特性

- 多邮箱服务（Tempmail.lol、Outlook、自定义域名）
- 批量注册
- 代理管理
- Token 导出（JSON/CSV/CPA）
- Web UI 管理界面

## Docker 部署

### 环境要求

- Docker
- Docker Compose

### 快速部署

```bash
git clone https://github.com/cnlimiter/codex-register.git
cd codex-register
docker-compose up -d
```

访问 http://localhost:8000

### 配置

**端口**：修改 `docker-compose.yml` 中的 `8000`

**代理**：
```yaml
environment:
  - HTTP_PROXY=http://your-proxy:port
  - HTTPS_PROXY=http://your-proxy:port
```

### 命令

```bash
docker-compose logs -f   # 查看日志
docker-compose down      # 停止
docker-compose build --no-cache  # 重新构建
```

## 注意

- 数据存储在 `./data` 目录
- 需要代理才能完成注册
