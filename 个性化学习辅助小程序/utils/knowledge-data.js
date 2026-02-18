// 知识点数据管理工具
// 提供知识图谱气泡数据的获取、缓存和处理

const storageKey = 'knowledge_points_cache';
const cacheExpiry = 24 * 60 * 60 * 1000; // 24小时缓存

/**
 * 获取知识点数据
 * @param {string} module - 模块名称（如'javascript'）
 * @param {number} nodeId - 学习节点ID
 * @returns {Promise<Array>} - 知识点数组
 */
async function getKnowledgePoints(module, nodeId) {
  // 1. 先尝试从本地缓存获取
  const cached = getCachedKnowledgePoints(module, nodeId);
  if (cached) {
    console.log('使用缓存的的知识点数据');
    return cached;
  }
  
  // 2. 从云数据库获取
  try {
    const knowledgePoints = await fetchFromDatabase(module, nodeId);
    
    // 3. 缓存到本地
    cacheKnowledgePoints(module, nodeId, knowledgePoints);
    
    return knowledgePoints;
  } catch (error) {
    console.error('获取知识点数据失败:', error);
    // 降级方案：返回默认数据
    return getDefaultKnowledgePoints(module);
  }
}

/**
 * 从本地缓存获取知识点
 */
function getCachedKnowledgePoints(module, nodeId) {
  try {
    const cache = wx.getStorageSync(storageKey);
    if (!cache) return null;
    
    const { timestamp, data } = cache;
    const now = new Date().getTime();
    
    // 检查缓存是否过期
    if (now - timestamp > cacheExpiry) {
      wx.removeStorageSync(storageKey);
      return null;
    }
    
    // 查找对应模块和节点的数据
    const moduleData = data[module];
    if (!moduleData) return null;
    
    return moduleData[nodeId] || null;
  } catch (error) {
    return null;
  }
}

/**
 * 缓存知识点到本地
 */
function cacheKnowledgePoints(module, nodeId, knowledgePoints) {
  try {
    let cache = wx.getStorageSync(storageKey);
    if (!cache) {
      cache = {
        timestamp: new Date().getTime(),
        data: {}
      };
    }
    
    if (!cache.data[module]) {
      cache.data[module] = {};
    }
    
    cache.data[module][nodeId] = knowledgePoints;
    cache.timestamp = new Date().getTime();
    
    wx.setStorageSync(storageKey, cache);
  } catch (error) {
    console.error('缓存知识点失败:', error);
  }
}

/**
 * 从云数据库获取知识点
 */
async function fetchFromDatabase(module, nodeId) {
  try {
    const db = wx.cloud.database();
    const result = await db.collection('knowledge_map')
      .where({
        module: module
      })
      .orderBy('order', 'asc')
      .get();
    
    // 添加模拟的进度数据（实际应该从学习记录中计算）
    const pointsWithProgress = result.data.map(point => ({
      ...point,
      accuracy: Math.floor(Math.random() * 100) // 模拟正确率，实际应从题目记录计算
    }));
    
    return pointsWithProgress;
  } catch (error) {
    console.error('查询云数据库失败:', error);
    throw error;
  }
}

/**
 * 获取默认知识点数据（降级方案）
 */
function getDefaultKnowledgePoints(module) {
  const defaultPoints = {
    javascript: [
      { id: 'js1', name: '变量声明', level: 'easy', description: 'let、const、var的区别' },
      { id: 'js2', name: '作用域链', level: 'medium', description: '作用域链的形成与查找规则' },
      { id: 'js3', name: '闭包', level: 'hard', description: '闭包的原理与应用场景' }
    ],
    'html-css': [
      { id: 'hc1', name: '盒模型', level: 'easy', description: '标准盒模型与怪异盒模型' },
      { id: 'hc2', name: 'Flex布局', level: 'medium', description: 'Flex容器与项目的属性' },
      { id: 'hc3', name: 'Grid布局', level: 'hard', description: '网格布局的高级特性' }
    ]
  };
  
  return defaultPoints[module] || defaultPoints.javascript;
}

/**
 * 计算知识点掌握程度（根据相关题目正确率）
 * @param {string} knowledgePoint - 知识点名称
 * @returns {Promise<number>} - 正确率（0-100）
 */
async function calculateAccuracy(knowledgePoint) {
  // TODO: 根据题目数据库计算该知识点的平均正确率
  // 目前返回一个随机值用于演示
  return Math.floor(Math.random() * 100);
}

/**
 * 根据正确率获取知识点状态颜色
 * @param {number} accuracy - 正确率（0-100）
 * @returns {string} - 状态颜色标识
 */
function getKnowledgeStatus(accuracy) {
  if (accuracy === 0) return 'gray';
  if (accuracy < 60) return 'light-blue';
  if (accuracy < 80) return 'blue';
  return 'green';
}

module.exports = {
  getKnowledgePoints,
  calculateAccuracy,
  getKnowledgeStatus
};