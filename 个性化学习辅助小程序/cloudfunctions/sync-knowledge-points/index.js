// 知识点数据同步云函数
// 每天凌晨3点自动执行，拉取GitHub Raw Markdown并解析入库

const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// GitHub Raw URL 配置
const KNOWLEDGE_SOURCES = [
  {
    url: 'https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/master/contents/zh/javascript-questions.md',
    module: 'javascript',
    level: 'medium',
    order: 1
  },
  {
    url: 'https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/master/contents/zh/html-questions.md',
    module: 'html',
    level: 'medium',
    order: 2
  },
  {
    url: 'https://raw.githubusercontent.com/yangshun/front-end-interview-handbook/master/contents/zh/css-questions.md',
    module: 'css',
    level: 'medium',
    order: 3
  }
];

/**
 * 从GitHub Raw获取Markdown内容
 * @param {string} url - GitHub Raw URL
 * @returns {Promise<string>} - Markdown文本
 */
async function fetchMarkdownFromGitHub(url) {
  try {
    console.log(`开始获取GitHub内容: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LearningApp/1.0)'
      },
      timeout: 10000 // 10秒超时
    });
    console.log(`GitHub内容获取成功，长度: ${response.data.length} 字符`);
    return response.data;
  } catch (error) {
    console.error('GitHub请求失败:', error.message, 'URL:', url);
    // 降级方案：返回空字符串，跳过该源
    return '';
  }
}

/**
 * 解析Markdown中的二级标题（##）
 * @param {string} markdown - Markdown文本
 * @returns {Array<string>} - 知识点名称数组
 */
function parseMarkdownHeaders(markdown) {
  if (!markdown) return [];
  
  console.log(`开始解析Markdown，长度: ${markdown.length} 字符`);
  
  // 正则匹配所有二级标题（##）和三级标题（###），排除第一个可能是一级文件标题的#号
  const headerRegex = /^#{2,3}\s+(.+)$/gm;
  const matches = [];
  let match;
  
  // 需要过滤掉的常见无关标题（针对前端面试宝典）
  const excludePatterns = [
    /^目录$/,
    /^Table of Contents$/i,
    /^参考/,
    /^延伸阅读/,
    /^TODO/,
    /^总结$/,
    /^小结$/,
    /^附录/,
    /^致谢/,
    /^license/i,
    /^贡献/i,
    /^changelog/i,
    /^前言/i,
    /^介绍/i,
    /^Introduction/i,
    /^贡献指南/i,
    /^translations?/i,
    /^其他语言/i,
    /^相关资源/i,
    /^反馈/i,
    /^star/i,
    /^赞助/i,
    /^支持/i,
    /^常见问题/i,
    /^faq/i,
    /^更新日志/i,
    /^release/i,
    /^版本/i,
    /^版权/i,
    /^copyright/i,
    /^免责声明/i,
    /^disclaimer/i
  ];
  
  // 统计找到的标题
  let totalHeaders = 0;
  
  while ((match = headerRegex.exec(markdown)) !== null) {
    totalHeaders++;
    const title = match[1].trim();
    const headerLevel = match[0].match(/^#+/)[0].length; // 2 或 3
    
    // 过滤掉排除列表中的标题
    const shouldExclude = excludePatterns.some(pattern => pattern.test(title));
    if (!shouldExclude) {
      matches.push({
        title: title,
        level: headerLevel
      });
      console.log(`找到标题 [${headerLevel === 2 ? '##' : '###'}]: ${title}`);
    } else {
      console.log(`排除标题 [${headerLevel === 2 ? '##' : '###'}]: ${title}`);
    }
  }
  
  console.log(`解析完成: 总共找到 ${totalHeaders} 个标题，保留 ${matches.length} 个有效标题`);
  
  // 只返回标题文本数组
  return matches.map(item => item.title);
}

/**
 * 保存知识点到数据库
 * @param {Array<Object>} knowledgePoints - 知识点数组
 * @param {Object} source - 数据源信息
 */
async function saveKnowledgePoints(knowledgePoints, source) {
  if (!knowledgePoints || knowledgePoints.length === 0) return;
  
  const collection = db.collection('knowledge_map');
  const now = new Date();
  
  for (let i = 0; i < knowledgePoints.length; i++) {
    const name = knowledgePoints[i];
    const pointId = `kp_${source.module}_${i + 1}`;
    
    try {
      // 检查是否已存在
      const existing = await collection.where({
        name,
        module: source.module
      }).get();
      
      if (existing.data.length > 0) {
        // 更新现有记录
        await collection.doc(existing.data[0]._id).update({
          data: {
            order: i + 1,
            updatedAt: now
          }
        });
      } else {
        // 插入新记录
        await collection.add({
          data: {
            _id: pointId,
            name,
            module: source.module,
            level: source.level,
            description: `关于${name}的核心知识点`,
            sourceUrl: source.url,
            order: i + 1,
            relatedQuestions: [],
            createdAt: now,
            updatedAt: now
          }
        });
      }
    } catch (error) {
      console.error('保存知识点失败:', error);
    }
  }
}

/**
 * 主函数 - 同步所有数据源
 */
async function syncAllSources() {
  console.log('开始同步知识点数据...');
  
  for (const source of KNOWLEDGE_SOURCES) {
    try {
      console.log(`正在同步: ${source.module} - ${source.url}`);
      
      // 获取Markdown
      const markdown = await fetchMarkdownFromGitHub(source.url);
      if (!markdown) {
        console.warn('获取Markdown失败，跳过');
        continue;
      }
      
      // 解析知识点
      const knowledgePoints = parseMarkdownHeaders(markdown);
      console.log(`解析出${knowledgePoints.length}个知识点`);
      
      // 保存到数据库
      await saveKnowledgePoints(knowledgePoints, source);
      
      console.log(`同步完成: ${source.module}`);
    } catch (error) {
      console.error(`同步${source.module}失败:`, error);
    }
  }
  
  console.log('所有数据源同步完成');
  return {
    success: true,
    message: '知识点数据同步完成',
    timestamp: new Date().toISOString()
  };
}

// 云函数入口
exports.main = async (event, context) => {
  try {
    return await syncAllSources();
  } catch (error) {
    console.error('云函数执行失败:', error);
    return {
      success: false,
      message: '同步失败: ' + error.message,
      timestamp: new Date().toISOString()
    };
  }
};