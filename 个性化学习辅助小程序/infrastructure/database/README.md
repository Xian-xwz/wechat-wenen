# 知识图谱数据库设计

## 集合：knowledge_map

### 字段定义

| 字段名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| _id | String | 是 | 知识点唯一标识符 | `kp_javascript_1` |
| name | String | 是 | 知识点名称 | `"变量提升"` |
| module | String | 是 | 所属模块 | `"javascript"`, `"html-css"` |
| level | String | 是 | 难度等级 | `"easy"`, `"medium"`, `"hard"` |
| description | String | 否 | 核心摘要 | `"关于变量提升的核心知识点"` |
| sourceUrl | String | 是 | 来源GitHub URL | `"https://raw.githubusercontent.com/..."` |
| order | Number | 是 | 在同模块中的排序 | `1`, `2`, `3` |
| relatedQuestions | Array | 否 | 关联题目ID数组 | `["q1", "q2"]` |
| createdAt | Date | 是 | 创建时间 | `2024-01-01T00:00:00.000Z` |
| updatedAt | Date | 是 | 更新时间 | `2024-01-01T00:00:00.000Z` |

### 索引设计

| 索引字段 | 排序 | 说明 |
|----------|------|------|
| module | 升序 | 按模块查询 |
| level | 升序 | 按难度筛选 |
| order | 升序 | 保持知识点顺序 |

### 数据示例

```json
{
  "_id": "kp_javascript_1",
  "name": "变量提升",
  "module": "javascript",
  "level": "easy",
  "description": "关于变量提升的核心知识点",
  "sourceUrl": "https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/02-first-steps/readme.md",
  "order": 1,
  "relatedQuestions": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 集合初始化

1. 在微信云开发控制台创建 `knowledge_map` 集合
2. 创建以下索引：
   - `module` (升序)
   - `level` (升序)
   - `order` (升序)

## 数据同步

数据通过云函数 `sync-knowledge-points` 定时同步（每天凌晨3点），从以下源获取：

1. JavaScript基础：https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/02-first-steps/readme.md
2. JavaScript对象：https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/04-object/readme.md
3. HTML/CSS检查清单：https://raw.githubusercontent.com/thedaviddias/Front-End-Checklist/master/README.zh-CN.md

同步逻辑：
- 解析Markdown中的二级标题（##）作为知识点
- 过滤掉"目录"、"参考"等无关标题
- 使用upsert策略更新数据库