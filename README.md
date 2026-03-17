# Codex Register Docker 部署

自动化注册 OpenAI Codex 账号的 Web UI 系统，支持多种邮箱服务、并发批量注册、代理管理和账号管理。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)

## 功能特性

- **多邮箱服务支持**
  - Tempmail.lol（临时邮箱，无需配置）
  - Outlook（IMAP + XOAUTH2，支持批量导入）
  - 自定义域名（两种子类型）
    - **MoeMail**：标准 REST API，配置 API 地址 + API 密钥
    - **TempMail**：自部署 Cloudflare Worker 临时邮箱

- **注册模式**
  - 单次注册
  - 批量注册（可配置数量和间隔时间）
  - Outlook 批量注册（指定账户逐一注册）

- **并发控制**
  - 流水线模式（Pipeline）：每隔 interval 秒启动新任务
  - 并行模式（Parallel）：所有任务同时提交
  - 并发数可在 UI 自定义（1-50）

- **实时监控**
  - WebSocket 实时日志推送
  - 跨页面导航后自动重连

- **代理管理**
  - 静态代理配置
  - 动态代理（通过 API 每次获取新 IP）
  - 代理列表（随机选取）

- **账号管理**
  - 查看、删除、批量操作
  - Token 刷新与验证
  - 导出（JSON / CSV / CPA 格式）
  - CPA 上传（Codex Protocol API，直连不走代理）
  - 订阅状态管理

- **支付升级**
  - 为账号生成 ChatGPT Plus 或 Team 订阅支付链接

- **系统设置**
  - 代理配置（静态 + 动态）
  - Outlook OAuth 参数
  - 注册参数（超时、重试、密码长度等）
  - 支持远程 PostgreSQL

## Docker 部署

### 环境要求

- Docker
- Docker Compose

### 快速部署

```bash
# 克隆本项目
git clone https://github.com/db52/codex-register.git
cd codex-register

# 启动服务
docker-compose up -d
```

服务启动后访问 http://localhost:8000

### 配置说明

**端口映射**：默认 `8000` 端口，可在 `docker-compose.yml` 中修改。

**访问密码**：环境变量 `APP_ACCESS_PASSWORD`，默认为 `admin123`

```yaml
environment:
  - APP_ACCESS_PASSWORD=你的密码
```

**数据持久化**：
```yaml
volumes:
  - ./data:/app/data
  - ./logs:/app/logs
```

**代理配置**（可选）：
```yaml
environment:
  - HTTP_PROXY=http://your-proxy:port
  - HTTPS_PROXY=http://your-proxy:port
```

### 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建
docker-compose build --no-cache
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_HOST` | 监听主机 | `0.0.0.0` |
| `APP_PORT` | 监听端口 | `8000` |
| `APP_ACCESS_PASSWORD` | Web UI 访问密钥 | `admin123` |
| `APP_DATABASE_URL` | 数据库连接字符串 | `data/database.db` |

## 更新日志

### v2 (2026-03-17)
- 新增 Outlook 批量注册功能
- 优化多邮箱服务支持
- 修复配置页面模块切换问题
- 更新 docker-compose 环境变量配置说明

### v1
- 初始版本
- 支持 Tempmail.lol、Outlook、自定义域名邮箱
- 支持批量注册和代理管理

## 注意事项

- 首次运行会自动创建 `data/` 目录和 SQLite 数据库
- 所有账号和设置数据存储在 `data/register.db`
- 需要代理才能完成注册

## License

[MIT](LICENSE)
