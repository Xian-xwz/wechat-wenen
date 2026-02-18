# 数据字段定义

## 知识图谱模块

### 知识点（knowledge_point）

| 字段名 | 类型 | 必填 | 描述 | 业务规则 |
|--------|------|------|------|----------|
| id | String | 是 | 知识点唯一ID | 格式：`kp_{模块}_{序号}` |
| name | String | 是 | 知识点名称 | 从Markdown二级标题提取 |
| module | String | 是 | 所属模块 | 枚举：`javascript`, `html-css` |
| level | String | 是 | 难度等级 | 枚举：`easy`, `medium`, `hard` |
| description | String | 否 | 核心摘要 | 默认："关于{name}的核心知识点" |
| source_url | String | 是 | 来源URL | GitHub Raw Markdown地址 |
| order | Number | 是 | 排序序号 | 同模块内从1开始递增 |
| related_questions | Array | 否 | 关联题目ID | 用于计算掌握程度 |
| created_at | Timestamp | 是 | 创建时间 | 首次同步时间 |
| updated_at | Timestamp | 是 | 更新时间 | 最近同步时间 |

### 学习进度（learning_progress）

| 字段名 | 类型 | 必填 | 描述 | 业务规则 |
|--------|------|------|------|----------|
| user_id | String | 是 | 用户ID | 微信OpenID |
| knowledge_point_id | String | 是 | 知识点ID | 关联knowledge_point.id |
| status | String | 是 | 学习状态 | `not_started`, `in_progress`, `completed` |
| accuracy | Number | 否 | 刷题正确率 | 0-100，用于气泡变色 |
| last_studied_at | Timestamp | 否 | 上次学习时间 | ISO格式 |
| created_at | Timestamp | 是 | 创建时间 | 首次学习时间 |
| updated_at | Timestamp | 是 | 更新时间 | 最近更新进度时间 |

## 颜色映射规则

| 正确率范围 | 颜色值 | 状态说明 | 气泡颜色 |
|------------|--------|----------|----------|
| 0% | #D9D9D9 | 未开始 | 灰色 |
| 1-60% | #4F8EF7 | 学习中 | 淡蓝色 |
| 60-80% | #0052D9 | 良好 | 蓝色 |
| 80-100% | #52C41A | 掌握 | 绿色 |

## 阿基米德螺旋线参数

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| a | Number | 80 | 螺旋线起始半径 |
| b | Number | 30 | 螺旋线增长系数 |
| angleStep | Number | 0.8 | 角度步长（弧度） |
| centerX | Number | 375 | 画布中心X坐标（750rpx基准） |
| centerY | Number | 300 | 画布中心Y坐标 |

## AI对话数据结构

### 消息（chat_message）

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | String | 是 | 消息ID（UUID） |
| sender | String | 是 | 发送者：`user` 或 `anna` |
| content | String | 是 | 消息内容 |
| timestamp | Timestamp | 是 | 发送时间 |
| context | Object | 否 | 上下文（如知识点ID） |

### 对话会话（chat_session）

| 字段名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| session_id | String | 是 | 会话ID |
| user_id | String | 是 | 用户ID |
| title | String | 否 | 会话标题（自动生成） |
| created_at | Timestamp | 是 | 创建时间 |
| last_message_at | Timestamp | 是 | 最后消息时间 |
| message_count | Number | 是 | 消息数量 |

## 数据同步触发器配置

| 字段名 | 类型 | 值 | 描述 |
|--------|------|-----|------|
| trigger_name | String | `dailySync` | 触发器名称 |
| trigger_type | String | `timer` | 触发器类型 |
| cron_expression | String | `0 0 3 * * * *` | 每天凌晨3点执行 |
| enabled | Boolean | `true` | 是否启用 |