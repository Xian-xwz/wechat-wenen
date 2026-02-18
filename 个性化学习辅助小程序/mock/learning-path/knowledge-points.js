// 知识图谱mock数据（开发阶段使用）
// 模拟从云数据库获取的知识点数据

const knowledgePointsData = {
  javascript: [
    {
      id: 'kp_javascript_1',
      name: '变量声明',
      module: 'javascript',
      level: 'easy',
      description: 'let、const、var的区别与使用场景',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/02-first-steps/readme.md',
      order: 1,
      relatedQuestions: ['q1', 'q2', 'q3'],
      accuracy: 85 // 模拟正确率
    },
    {
      id: 'kp_javascript_2',
      name: '数据类型',
      module: 'javascript',
      level: 'easy',
      description: '基本类型与引用类型的区别',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/02-first-steps/readme.md',
      order: 2,
      relatedQuestions: ['q4', 'q5'],
      accuracy: 72
    },
    {
      id: 'kp_javascript_3',
      name: '类型转换',
      module: 'javascript',
      level: 'medium',
      description: '显式转换与隐式转换的规则',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/02-first-steps/readme.md',
      order: 3,
      relatedQuestions: ['q6', 'q7', 'q8'],
      accuracy: 60
    },
    {
      id: 'kp_javascript_4',
      name: '运算符',
      module: 'javascript',
      level: 'medium',
      description: '算术、比较、逻辑运算符的优先级',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/02-first-steps/readme.md',
      order: 4,
      relatedQuestions: ['q9'],
      accuracy: 45
    },
    {
      id: 'kp_javascript_5',
      name: '函数定义',
      module: 'javascript',
      level: 'medium',
      description: '函数声明、表达式、箭头函数的区别',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/04-object/readme.md',
      order: 5,
      relatedQuestions: ['q10', 'q11'],
      accuracy: 90
    },
    {
      id: 'kp_javascript_6',
      name: '作用域链',
      module: 'javascript',
      level: 'hard',
      description: '作用域链的形成与变量查找规则',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/04-object/readme.md',
      order: 6,
      relatedQuestions: ['q12', 'q13'],
      accuracy: 35
    },
    {
      id: 'kp_javascript_7',
      name: '闭包',
      module: 'javascript',
      level: 'hard',
      description: '闭包的原理、应用场景与内存管理',
      sourceUrl: 'https://raw.githubusercontent.com/ilyakan/javascript-tutorial-zh/master/1-js/04-object/readme.md',
      order: 7,
      relatedQuestions: ['q14', 'q15'],
      accuracy: 20
    }
  ],
  'html-css': [
    {
      id: 'kp_htmlcss_1',
      name: '盒模型',
      module: 'html-css',
      level: 'easy',
      description: '标准盒模型与怪异盒模型的区别',
      sourceUrl: 'https://raw.githubusercontent.com/thedaviddias/Front-End-Checklist/master/README.zh-CN.md',
      order: 1,
      relatedQuestions: ['q16'],
      accuracy: 95
    },
    {
      id: 'kp_htmlcss_2',
      name: 'Flex布局',
      module: 'html-css',
      level: 'medium',
      description: 'Flex容器与项目的属性详解',
      sourceUrl: 'https://raw.githubusercontent.com/thedaviddias/Front-End-Checklist/master/README.zh-CN.md',
      order: 2,
      relatedQuestions: ['q17', 'q18'],
      accuracy: 78
    },
    {
      id: 'kp_htmlcss_3',
      name: 'Grid布局',
      module: 'html-css',
      level: 'hard',
      description: '网格布局的高级特性与响应式设计',
      sourceUrl: 'https://raw.githubusercontent.com/thedaviddias/Front-End-Checklist/master/README.zh-CN.md',
      order: 3,
      relatedQuestions: ['q19', 'q20'],
      accuracy: 55
    },
    {
      id: 'kp_htmlcss_4',
      name: '响应式设计',
      module: 'html-css',
      level: 'medium',
      description: '媒体查询与移动优先的策略',
      sourceUrl: 'https://raw.githubusercontent.com/thedaviddias/Front-End-Checklist/master/README.zh-CN.md',
      order: 4,
      relatedQuestions: ['q21'],
      accuracy: 65
    },
    {
      id: 'kp_htmlcss_5',
      name: 'CSS变量',
      module: 'html-css',
      level: 'medium',
      description: 'CSS自定义属性的定义与使用',
      sourceUrl: 'https://raw.githubusercontent.com/thedaviddias/Front-End-Checklist/master/README.zh-CN.md',
      order: 5,
      relatedQuestions: [],
      accuracy: 40
    }
  ]
};

// 获取指定模块的知识点
function getKnowledgePoints(module) {
  return knowledgePointsData[module] || knowledgePointsData.javascript;
}

// 获取所有知识点（用于知识图谱）
function getAllKnowledgePoints() {
  const allPoints = [];
  Object.keys(knowledgePointsData).forEach(module => {
    allPoints.push(...knowledgePointsData[module]);
  });
  return allPoints;
}

module.exports = {
  getKnowledgePoints,
  getAllKnowledgePoints
};