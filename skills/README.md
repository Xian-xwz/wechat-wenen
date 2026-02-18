# Skills 目录

本目录包含项目使用的各种技能模块。

## 可用 Skills

| Skill | 描述 | 用法 |
|-------|------|------|
| `frontend_interview_cleaner` | 前端面试题清洗工具 - 将简答题转换为小程序选择题 | `python -m skills.frontend_interview_cleaner.cli pipeline` |
| `convert-docs` | 文档转换工具 | - |
| `wechat_miniprogram_agent` | 微信小程序AI Agent集成技能 - 提供标准集成方法和最佳实践 | `from skills.wechat_miniprogram_agent import create_miniprogram_agent` |

## frontend_interview_cleaner

将 front-end-interview-handbook 的 Markdown 简答题转换为小程序可用的选择题题库。

### 命令行用法

```bash
# 运行完整清洗管道（生成 + 导出）
python -m skills.frontend_interview_cleaner.cli pipeline

# 指定分类和数量
python -m skills.frontend_interview_cleaner.cli pipeline --categories javascript html --max-per-category 20

# 仅生成选择题
python -m skills.frontend_interview_cleaner.cli generate --categories javascript --max-per-category 10

# 测试API连接
python -m skills.frontend_interview_cleaner.cli test
```

### Python API 用法

```python
from skills.frontend_interview_cleaner import generate_questions, export_questions
import asyncio

async def main():
    # 生成选择题
    result = await generate_questions(
        categories=["javascript"],
        max_per_category=10
    )
    
    if result["success"]:
        questions = result["all_questions"]
        # 导出到小程序格式
        export_questions(questions)

asyncio.run(main())
```

### 目录结构

```
frontend_interview_cleaner/
├── __init__.py          # 模块入口，暴露核心API
├── cli.py               # 命令行入口
├── config.py            # 配置管理
├── llm_client.py        # 大模型API客户端
├── prompt_engineer.py   # Prompt工程
├── transformer.py       # 数据格式转换
├── generator.py         # 题目生成器
├── utils.py             # 工具函数
└── .env.example         # 环境变量示例
```

### 配置说明

需要在项目根目录创建 `.env` 文件：

```env
# LLM API 配置
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-max

# 处理配置
BATCH_SIZE=5
MAX_RETRIES=3

# 输出配置
OUTPUT_DIR=cleaned_data
SOURCE_MD_DIR=source_md
```
