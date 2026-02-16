/**
 * ECharts 图表配置封装
 * 用于学习概况数据大屏的图表渲染
 */

/**
 * 雷达图配置 - 知识掌握度
 * @param {array} data - 各维度数据，如：[80, 70, 90, 60, 85]
 * @param {array} indicators - 维度定义，如：[{name: '数据结构', max: 100}, ...]
 * @returns {object} ECharts 配置
 */
function getRadarOption(data, indicators) {
  return {
    backgroundColor: 'transparent',
    radar: {
      indicator: indicators || [
        { name: '数据结构', max: 100 },
        { name: '算法', max: 100 },
        { name: '计算机网络', max: 100 },
        { name: '操作系统', max: 100 },
        { name: '数据库', max: 100 },
        { name: '前端开发', max: 100 }
      ],
      radius: '65%',
      center: ['50%', '50%'],
      splitNumber: 4,
      axisName: {
        color: '#666',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 82, 217, 0.1)'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(0, 82, 217, 0.02)', 'rgba(0, 82, 217, 0.05)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 82, 217, 0.2)'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: data || [80, 70, 90, 60, 85, 75],
        name: '知识掌握度',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#1890FF',
          width: 2
        },
        areaStyle: {
          color: 'rgba(24, 144, 255, 0.3)'
        },
        itemStyle: {
          color: '#1890FF',
          borderColor: '#fff',
          borderWidth: 2
        }
      }]
    }]
  };
}

/**
 * 折线图配置 - 学习趋势
 * @param {array} dates - 日期数组，如：['周一', '周二', ...]
 * @param {array} studyData - 学习活跃度数据
 * @param {array} correctData - 正确率数据
 * @returns {object} ECharts 配置
 */
function getTrendOption(dates, studyData, correctData) {
  return {
    backgroundColor: 'transparent',
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    legend: {
      data: ['学习活跃度', '正确率'],
      top: 0,
      textStyle: {
        color: '#666',
        fontSize: 12
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: {
        lineStyle: {
          color: '#eee'
        }
      },
      axisLabel: {
        color: '#999',
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '活跃度',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#999',
          fontSize: 11
        },
        splitLine: {
          lineStyle: {
            color: '#f5f5f5'
          }
        }
      },
      {
        type: 'value',
        name: '正确率',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: '#999',
          fontSize: 11
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '学习活跃度',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: studyData || [65, 78, 82, 70, 88, 92, 85],
        lineStyle: {
          color: '#1890FF',
          width: 3
        },
        itemStyle: {
          color: '#1890FF',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: '正确率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        symbol: 'circle',
        symbolSize: 6,
        data: correctData || [72, 75, 80, 78, 85, 88, 82],
        lineStyle: {
          color: '#52C41A',
          width: 3
        },
        itemStyle: {
          color: '#52C41A',
          borderColor: '#fff',
          borderWidth: 2
        }
      }
    ]
  };
}

/**
 * 初始化 ECharts 图表（微信小程序）
 * @param {object} canvas - canvas 上下文
 * @param {object} echarts - echarts 实例
 * @param {string} type - 图表类型：'radar' | 'trend'
 * @param {object} data - 图表数据
 * @returns {object} chart 实例
 */
function initChart(canvas, echarts, type, data = {}) {
  let option;
  
  switch (type) {
    case 'radar':
      option = getRadarOption(data.values, data.indicators);
      break;
    case 'trend':
      option = getTrendOption(data.dates, data.studyData, data.correctData);
      break;
    default:
      console.error('[Chart] 不支持的图表类型:', type);
      return null;
  }

  const chart = echarts.init(canvas, null, {
    width: canvas.width,
    height: canvas.height
  });
  
  chart.setOption(option);
  
  return chart;
}

/**
 * 更新图表数据
 * @param {object} chart - 图表实例
 * @param {string} type - 图表类型
 * @param {object} data - 新数据
 */
function updateChart(chart, type, data = {}) {
  if (!chart) return;
  
  let option;
  
  switch (type) {
    case 'radar':
      option = getRadarOption(data.values, data.indicators);
      break;
    case 'trend':
      option = getTrendOption(data.dates, data.studyData, data.correctData);
      break;
    default:
      return;
  }
  
  chart.setOption(option, true);
}

module.exports = {
  getRadarOption,
  getTrendOption,
  initChart,
  updateChart
};
