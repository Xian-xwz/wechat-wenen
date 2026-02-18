// 学习进度存储工具
// 管理用户学习进度的本地存储和同步

const storageKey = 'learning_progress';
const version = '1.0';

/**
 * 获取节点学习进度
 * @param {number} nodeId - 节点ID
 * @returns {Object} - 进度数据
 */
function getNodeProgress(nodeId) {
  try {
    const progress = wx.getStorageSync(storageKey);
    if (!progress) return createDefaultProgress(nodeId);
    
    // 版本检查
    if (progress.version !== version) {
      console.log('进度数据版本更新，重置数据');
      return createDefaultProgress(nodeId);
    }
    
    return progress.nodes[nodeId] || createDefaultNodeProgress(nodeId);
  } catch (error) {
    console.error('获取学习进度失败:', error);
    return createDefaultNodeProgress(nodeId);
  }
}

/**
 * 保存节点学习进度
 * @param {number} nodeId - 节点ID
 * @param {Object} data - 进度数据
 */
function saveNodeProgress(nodeId, data) {
  try {
    let progress = wx.getStorageSync(storageKey);
    if (!progress) {
      progress = {
        version,
        nodes: {}
      };
    }
    
    // 确保数据结构一致
    progress.nodes[nodeId] = {
      ...getNodeProgress(nodeId),
      ...data,
      updatedAt: new Date().getTime()
    };
    
    wx.setStorageSync(storageKey, progress);
    console.log(`节点${nodeId}进度已保存`);
  } catch (error) {
    console.error('保存学习进度失败:', error);
  }
}

/**
 * 获取知识点完成状态
 * @param {number} nodeId - 节点ID
 * @returns {Object} - 知识点完成状态映射
 */
function getKnowledgeStatus(nodeId) {
  const progress = getNodeProgress(nodeId);
  return progress.knowledgePoints || {};
}

/**
 * 更新知识点完成状态
 * @param {number} nodeId - 节点ID
 * @param {string} kpId - 知识点ID
 * @param {boolean} completed - 是否完成
 */
function updateKnowledgeStatus(nodeId, kpId, completed) {
  const progress = getNodeProgress(nodeId);
  
  if (!progress.knowledgePoints) {
    progress.knowledgePoints = {};
  }
  
  progress.knowledgePoints[kpId] = completed;
  
  // 重新计算整体进度
  progress.overallProgress = calculateProgress(progress);
  
  saveNodeProgress(nodeId, progress);
}

/**
 * 计算节点整体进度
 * @param {Object} progress - 节点进度数据
 * @returns {number} - 进度百分比（0-100）
 */
function calculateProgress(progress) {
  if (!progress.knowledgePoints || Object.keys(progress.knowledgePoints).length === 0) {
    return 0;
  }
  
  const completedCount = Object.values(progress.knowledgePoints).filter(status => status).length;
  const totalCount = Object.keys(progress.knowledgePoints).length;
  
  return Math.round((completedCount / totalCount) * 100);
}

/**
 * 获取节点学习统计
 * @param {number} nodeId - 节点ID
 * @returns {Object} - 学习统计数据
 */
function getLearningStats(nodeId) {
  const progress = getNodeProgress(nodeId);
  
  return {
    studyTime: progress.studyTime || 0,
    completedTasks: progress.completedTasks || 0,
    quizScore: progress.quizScore || 0,
    lastStudyAt: progress.lastStudyAt || null,
    overallProgress: progress.overallProgress || 0,
    updatedAt: progress.updatedAt || null
  };
}

/**
 * 记录学习时间
 * @param {number} nodeId - 节点ID
 * @param {number} minutes - 学习分钟数
 */
function recordStudyTime(nodeId, minutes) {
  const progress = getNodeProgress(nodeId);
  
  progress.studyTime = (progress.studyTime || 0) + minutes;
  progress.lastStudyAt = new Date().getTime();
  
  saveNodeProgress(nodeId, progress);
}

/**
 * 创建默认进度数据结构
 */
function createDefaultProgress() {
  return {
    version,
    nodes: {},
    lastSync: null
  };
}

/**
 * 创建默认节点进度
 */
function createDefaultNodeProgress(nodeId) {
  return {
    nodeId,
    overallProgress: 0,
    knowledgePoints: {},
    studyTime: 0,
    completedTasks: 0,
    quizScore: 0,
    lastStudyAt: null,
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime()
  };
}

module.exports = {
  getNodeProgress,
  saveNodeProgress,
  getKnowledgeStatus,
  updateKnowledgeStatus,
  getLearningStats,
  recordStudyTime,
  calculateProgress
};