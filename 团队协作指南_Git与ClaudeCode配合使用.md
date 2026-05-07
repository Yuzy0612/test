# 团队协作指南：Git 远程仓库 + Claude Code 配合使用

---

## 第一步：初始化本地 Git 仓库

在你的项目根目录（E:/aitest8）执行：

```bash
cd E:/aitest8

# 初始化 Git 仓库
git init

# 将所有已有文件加入暂存区
git add .

# 创建第一个提交
git commit -m "feat: 项目初始化"
```

---

## 第二步：创建远程仓库（GitHub / GitLab / Gitee）

以 GitHub 为例，另外两个平台操作几乎一样：

1. 打开 https://github.com 登录你的账号
2. 点击右上角 **"+"** → **"New repository"**
3. 填入仓库名称（比如 `my-project`）
4. **不要勾选** "Add a README file"（因为我们本地已有文件）
5. 点击 **"Create repository"**

创建后会看到类似这样的地址：
```
https://github.com/你的用户名/my-project.git
```

---

## 第三步：关联远程仓库并推送

```bash
# 添加远程仓库（把地址替换成你的实际地址）
git remote add origin https://github.com/你的用户名/my-project.git

# 确认远程仓库已添加
git remote -v

# 推送到远程仓库（首次推送需要 -u 设定上游分支）
git push -u origin main
```

> **注意：** 如果本地分支叫 `master`，改成 `git push -u origin master`

---

## 第四步：团队成员克隆仓库

团队其他成员拿到仓库地址后：

```bash
# 克隆仓库到本地
git clone https://github.com/你的用户名/my-project.git

# 进入项目目录
cd my-project
```

然后用 Claude Code 打开这个目录即可开始开发：
```bash
claude
```

---

## 第五步：日常协作流程

### 核心原则：**每个人在自己的分支上开发**

```
main ──────────────────────●────●────●────  （主分支，只接受合并）
        ↘                                   
feat-login  ──●──●──●──●                    （功能分支，日常开发在这）
        ↘                                   
fix-bug     ──●──●                          （修复分支）
```

### 标准操作流程

```bash
# 1. 开始新功能前，切到 main 并拉取最新代码
git checkout main
git pull

# 2. 创建你自己的功能分支（用有意义的名称）
git checkout -b feat/你的功能名

# 3. 在 Claude Code 中开发...

# 4. 查看自己改了什么
git status
git diff

# 5. 提交你的改动
git add .
git commit -m "feat: 完成登录页面布局"

# 6. 推送到远程（首次推送当前分支）
git push -u origin feat/你的功能名

# 7. 后续推送只需要
git push
```

### 让 Claude Code 帮你在终端运行 Git 命令

在 Claude Code 对话中直接说：

```
帮我切到 feat-login 分支
帮我提交当前改动，commit 信息写 "feat: 完成登录表单"
帮我推送到远程
```

Claude Code 会读取当前代码状态并帮你执行命令。

---

## 第六步：提交代码到 main（两种方式）

### 方式 A：Pull Request（推荐 ★）

1. 推送你的分支到远程后，去 GitHub 页面
2. 点击 **"Compare & pull request"**
3. 填写 PR 标题和描述
4. 让队友 Review
5. 审核通过后点击 **"Merge pull request"**

让 Claude Code 帮你创建 PR：
```bash
gh pr create --title "feat: 登录页面" --body "## 改动说明
- 完成登录页面布局
- 接入登录 API

## 测试
- [x] 本地测试通过
"
```

### 方式 B：直接在终端合并

```bash
# 回到 main 分支
git checkout main

# 拉取最新
git pull

# 合并你的功能分支
git merge feat/你的功能名

# 推送到远程
git push
```

---

## 第七步（重点）：冲突处理

冲突发生的前提：**两个人改了同一个文件的同一行代码。**

### 冲突场景模拟

假设 A 和 B 都改了 `src/App.tsx` 第 10 行：

- A 先合并到 main
- B 再想合并时，就会触发冲突

### 冲突看起来长什么样

```typescript
// src/App.tsx

function App() {
  return (
<<<<<<< HEAD        ← 这是当前分支（main）的内容
    <h1>欢迎回来</h1>
=======              ← 分隔线
    <h1>你好，世界</h1>
>>>>>>> feat-bob    ← 这是B的分支的内容
  );
}
```

### 解决冲突步骤

**第 1 步：让 Claude Code 帮你解决**

在 Claude Code 对话中说：

> 我当前在 feat-bob 分支，准备合并 main，出现了冲突。帮我读取冲突文件，分析两个版本的差异，告诉我应该保留哪个或者如何合并。

Claude Code 会：
- 读取冲突文件
- 显示两个版本的差异
- 帮你决定如何处理

**第 2 步：手动编辑冲突标记**

选择保留的内容（删掉 `<<<<<<<`、`=======`、`>>>>>>>` 这些标记）：

```typescript
function App() {
  return (
    <h1>你好，世界 - 修改版</h1>   ← 合并后的最终版本
  );
}
```

**第 3 步：标记冲突已解决并提交**

```bash
# 标记冲突已解决
git add src/App.tsx

# 完成合并
git commit -m "merge: 解决与 main 的冲突"
```

### 用 Claude Code 直接解决冲突

直接在对话中说：

```
帮我修复 src/App.tsx 的合并冲突，保留 feat-bob 分支的版本
```

或者：

```
帮我合并冲突，两边的改动我都要，把两个 h1 合在一起显示
```

Claude Code 会打开文件并帮你编辑。

---

## 第八步：常用命令速查表

| 操作 | 命令 |
|------|------|
| 查看状态 | `git status` |
| 查看改动 | `git diff` |
| 查看分支 | `git branch -a` |
| 切换分支 | `git checkout 分支名` |
| 创建并切换分支 | `git checkout -b 新分支名` |
| 暂存所有改动 | `git add .` |
| 提交 | `git commit -m "消息"` |
| 拉取远程代码 | `git pull` |
| 推送 | `git push` |
| 查看提交历史 | `git log --oneline` |
| 放弃本地改动（小心！） | `git checkout -- 文件名` |
| 暂存当前工作 | `git stash` |
| 恢复暂存 | `git stash pop` |
| 中止合并 | `git merge --abort` |

---

## 第九步：团队协作最佳实践

### 1. 每次开发前先拉取
```bash
git checkout main
git pull
git checkout -b feat/你的分支名
```

### 2. 频繁提交，小步快跑
不要攒 100 行改动一次性提交。改完一个小功能就提交一次。

### 3. 提交信息要有意义
```
✅ feat: 添加用户登录功能
✅ fix: 修复导航栏错位问题
❌ update
❌ 改了点东西
```

### 4. 每天推送你的分支
即使功能没做完，也推到远程。相当于云备份，队友也能看到进度。

### 5. 在 Claude Code 中直接操作 Git

Claude Code 理解 Git，你可以用自然语言让它帮你：

| 你想做什么 | 对 Claude Code 说的话 |
|-----------|----------------------|
| 切分支 | "帮我创建一个叫 feat/api 的新分支" |
| 提交代码 | "帮我提交改动，写一句合适的 commit 信息" |
| 推代码 | "帮我把当前分支推送到远程" |
| 看状态 | "帮我看看 git 状态" |
| 解决冲突 | "合并时出现冲突了，帮我在编辑器中解决" |
| 回退 | "我想撤销最后一次 commit 但保留改动" |

---

## 第十步：快速验证你学会了没

照着走一遍：

```bash
# 1. 初始化（已完成的话跳过）
git init
git add .
git commit -m "init"

# 2. 在 GitHub 创建远程仓库后：
git remote add origin <你的仓库地址>
git push -u origin main

# 3. 模拟一次"冲突前"的协作：
git checkout -b feat/test-branch
echo "// test change" >> src/test.ts
git add src/test.ts
git commit -m "test: 测试改动"
git push -u origin feat/test-branch

# 4. 切回 main 合并（在 GitHub 上创建 PR 或本地 merge）
git checkout main
git merge feat/test-branch
git push
```

跑通上面的流程，你就掌握了团队协作的全部必要操作。
