// 帖子发布页
Page({
  data: {
    title: '',
    content: '',
    selectedType: 'question',
    isPublishing: false,
    
    // 帖子类型
    postTypes: [
      { label: '问答', value: 'question' },
      { label: '笔记', value: 'note' },
      { label: '分享', value: 'share' }
    ],
    
    // 可选标签
    availableTags: [
      { name: '数据结构', selected: false },
      { name: '算法', selected: false },
      { name: '计算机网络', selected: false },
      { name: '操作系统', selected: false },
      { name: '数据库', selected: false },
      { name: '前端开发', selected: false },
      { name: '后端开发', selected: false },
      { name: '人工智能', selected: false },
      { name: '大数据', selected: false },
      { name: '云计算', selected: false },
    ]
  },

  onLoad(options) {
    // 如果是编辑模式，加载草稿数据
    if (options.draftId) {
      this.loadDraft(options.draftId);
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 选择帖子类型
  selectType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({ selectedType: type });
  },

  // 标题输入
  onTitleChange(e) {
    this.setData({ title: e.detail.value });
  },

  // 内容输入
  onContentChange(e) {
    this.setData({ content: e.detail.value });
  },

  // 切换标签选择
  toggleTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.availableTags;
    tags[index].selected = !tags[index].selected;
    this.setData({ availableTags: tags });
  },

  // 输入框聚焦处理
  onInputFocus(e) {
    // 键盘弹出时，可以在这里处理滚动逻辑
    // 暂时留空，让页面自己处理
  },

  // 验证表单
  validateForm() {
    const { title, content } = this.data;
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });
      return false;
    }
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return false;
    }
    
    return true;
  },

  // 获取选中的标签
  getSelectedTags() {
    return this.data.availableTags
      .filter(tag => tag.selected)
      .map(tag => tag.name);
  },

  // 保存草稿
  saveDraft() {
    const draftData = {
      title: this.data.title,
      content: this.data.content,
      type: this.data.selectedType,
      tags: this.getSelectedTags(),
      saveTime: new Date().toISOString()
    };
    
    // 保存到本地存储
    const drafts = wx.getStorageSync('postDrafts') || [];
    drafts.push(draftData);
    wx.setStorageSync('postDrafts', drafts);
    
    wx.showToast({
      title: '已保存到草稿',
      icon: 'success'
    });
    
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  },

  // 发布帖子
  async publish() {
    if (!this.validateForm()) return;
    
    this.setData({ isPublishing: true });
    
    const postData = {
      title: this.data.title,
      content: this.data.content,
      type: this.data.selectedType,
      tags: this.getSelectedTags()
    };
    
    // TODO: 调用后端接口发布帖子
    // const { createPost } = require('../../api/request');
    // try {
    //   await createPost(postData);
    //   wx.showToast({ title: '发布成功', icon: 'success' });
    //   wx.navigateBack();
    // } catch (err) {
    //   wx.showToast({ title: '发布失败', icon: 'none' });
    // }
    
    // 模拟发布成功
    setTimeout(() => {
      this.setData({ isPublishing: false });
      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1500);
  },

  // 加载草稿
  loadDraft(draftId) {
    const drafts = wx.getStorageSync('postDrafts') || [];
    const draft = drafts.find(d => d.id === draftId);
    
    if (draft) {
      this.setData({
        title: draft.title,
        content: draft.content,
        selectedType: draft.type
      });
      
      // 恢复标签选择
      const tags = this.data.availableTags.map(tag => ({
        ...tag,
        selected: draft.tags.includes(tag.name)
      }));
      this.setData({ availableTags: tags });
    }
  }
});
