# 个性化学习辅助小程序

一个基于微信小程序的个性化学习辅助工具，集成AI对话功能和前端面试题库。

## 项目特色

### 🎯 核心功能
- **AI学习助手**：集成腾讯云AI Agent，提供智能问答和代码解释
- **前端面试题库**：通过大模型将Markdown简答题转换为4选项单选题
- **个性化学习路径**：基于用户知识图谱推荐学习内容
- **实时聊天界面**：支持Markdown渲染和代码块高亮

### 🛠️ 技术栈
- **前端**：微信小程序 + TDesign组件库
- **后端**：腾讯云云开发 + AI Agent服务
- **数据处理**：Python + 阿里云DashScope API
- **构建工具**：微信开发者工具 + npm

## 项目结构

```
个性化学习辅助小程序/
├── pages/                       # 小程序页面
│   ├── anna-chat/              # AI对话页面（核心功能）
│   ├── home/                   # 首页
│   ├── quiz/                   # 刷题页面
│   └── ...
├── utils/                      # 工具函数
│   ├── anna-service.js         # AI服务封装
│   ├── marked.js               # Markdown解析器
│   └── ...
├── cloudfunctions/             # 云函数
└── components/                 # 自定义组件

skills/                         # Python技能模块
├── frontend_interview_cleaner/ # 前端面试题清洗工具
└── wechat_miniprogram_agent/   # 小程序代理工具

logs/                           # 开发日志
├── 开发日志.md                 # 日常开发记录
└── 实现路径.md                 # 项目实现路径
```

## 快速开始

### 环境要求
- Node.js 14+
- 微信开发者工具
- Python 3.8+（数据处理）

### 小程序开发
1. 克隆项目
```bash
git clone <repository-url>
cd 恩论文/个性化学习辅助小程序
```

2. 安装依赖
```bash
npm install
```

3. 使用微信开发者工具打开项目
4. 构建npm包
```bash
工具 -> 构建npm
```

5. 编译运行

### 数据处理（生成题库）
1. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入DASHSCOPE_API_KEY
```

2. 安装Python依赖
```bash
cd skills/frontend_interview_cleaner
pip install -r requirements.txt
```

3. 运行题库生成器
```bash
python main.py
```

## 功能模块

### 🤖 AI对话模块
- **智能问答**：基于用户问题的上下文理解
- **代码解释**：支持代码块高亮和复制功能
- **流式输出**：实现打字机效果的回复
- **Markdown渲染**：支持标题、加粗、列表、代码块等格式

### 📚 题库模块
- **题目来源**：基于front-end-interview-handbook
- **智能转换**：使用大模型将简答题转换为单选题
- **质量保证**：严格的输出格式验证和错误处理
- **批量处理**：支持并发处理和缓存机制

### 🎨 用户界面
- **TDesign组件**：统一的UI设计规范
- **响应式布局**：适配不同屏幕尺寸
- **深色代码块**：DeepSeek风格的代码高亮
- **流畅动画**：加载动画和过渡效果

## 安全配置

### 敏感信息保护
项目已配置.gitignore文件，保护以下敏感信息：
- API密钥（.env文件）
- 缓存文件（.cache/）
- 错误日志（error_log.json）
- 开发日志（logs/）

### 环境变量模板
参考`.env.example`文件配置环境变量：
```bash
# 大模型 API 配置
DASHSCOPE_API_KEY=your_api_key_here
```

## 开发记录

详细的开发过程和问题修复记录请查看：
- `logs/开发日志.md` - 日常开发记录
- `logs/实现路径.md` - 项目架构和实现路径

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过GitHub Issues提交。