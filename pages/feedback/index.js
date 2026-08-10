const repository = require('../../services/repository')

Page({
  data: {
    usefulOptions: ['很有用', '有一点用', '暂时没感觉'],
    form: {
      useful: '',
      comment: ''
    },
    saving: false
  },

  chooseUseful(event) {
    this.setData({ 'form.useful': event.currentTarget.dataset.value })
  },

  onCommentInput(event) {
    this.setData({ 'form.comment': event.detail.value })
  },

  async submit() {
    if (!this.data.form.useful) {
      wx.showToast({ title: '先选一下整体感受吧', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    await repository.saveFeedback(this.data.form)
    await repository.track('feedback_submitted', {
      useful: this.data.form.useful
    })
    this.setData({ saving: false })
    wx.showModal({
      title: '谢谢你，球友',
      content: '你的反馈已经收好，会成为下一次迭代的依据。',
      showCancel: false,
      success: () => wx.navigateBack()
    })
  }
})
