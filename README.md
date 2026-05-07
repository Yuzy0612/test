# VFM 前后端分离交互项目

基于 `prd.md` 与 `plan.md` 搭建的可交互演示项目，包含：

- `backend`：Express API 服务（井列表、实时计量、回配、报表、PI同步状态）
- `frontend`：React + Vite 前端页面（调用后端接口并展示交互结果）

## 目录结构

```text
backend/
  src/
    index.js
    data.js
frontend/
  src/
    App.jsx
    main.jsx
    styles.css
```

## 启动方式

1. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端默认从 `http://localhost:3003` 开始监听；若端口被占用会自动尝试 `3004`、`3005` 等可用端口（最多连续尝试20个端口）。

2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认地址：`http://localhost:5173`，已通过 Vite 代理转发 `/api` 到后端。

## 已实现交互

- 拉取井列表并选择单井
- 查询单井实时油气水产量
- 执行区块回配任务
- 创建日报生成任务
- 查看 PI 单向同步状态
