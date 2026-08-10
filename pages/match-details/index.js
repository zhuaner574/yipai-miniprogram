Page({
  data: {
    matchLevels: ['不填写', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5及以上'],
    matchCounts: ['不填写', '2场', '3场', '4场', '5场', '6场', '7场', '8场', '9场', '10场及以上'],
    placementOptions: ['冠军', '亚军', '四强', '八强', '十六强', '小组赛'],
    form: {
      matchFormat: 'single',
      matchLevel: '',
      matchResult: '',
      matchCount: 0,
      placement: '',
      score: ''
    }
  },

  onLoad() {
    const eventChannel = this.getOpenerEventChannel()
    eventChannel.on('initialData', details => {
      this.setData({ form: { ...this.data.form, ...details } })
    })
  },

  chooseFormat(event) {
    const matchFormat = event.currentTarget.dataset.value
    this.setData({
      'form.matchFormat': matchFormat,
      'form.matchResult': matchFormat === 'single' ? this.data.form.matchResult : '',
      'form.placement': matchFormat === 'tournament' ? this.data.form.placement : ''
    })
  },

  chooseResult(event) {
    const value = event.currentTarget.dataset.value
    this.setData({ 'form.matchResult': this.data.form.matchResult === value ? '' : value })
  },

  choosePlacement(event) {
    const value = event.currentTarget.dataset.value
    this.setData({ 'form.placement': this.data.form.placement === value ? '' : value })
  },

  onLevelChange(event) {
    const value = this.data.matchLevels[event.detail.value]
    this.setData({ 'form.matchLevel': value === '不填写' ? '' : value })
  },

  onCountChange(event) {
    const value = this.data.matchCounts[event.detail.value]
    this.setData({
      'form.matchCount': value === '不填写' ? 0 : (value === '10场及以上' ? 10 : Number(value.replace('场', '')))
    })
  },

  onPlacementInput(event) {
    this.setData({ 'form.placement': event.detail.value })
  },

  onScoreInput(event) {
    this.setData({ 'form.score': event.detail.value })
  },

  save() {
    this.getOpenerEventChannel().emit('detailsUpdated', this.data.form)
    wx.navigateBack()
  }
})
