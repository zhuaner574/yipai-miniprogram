const env = require('./config/env')

App({
  onLaunch() {
    if (env.cloudEnvId && wx.cloud) {
      wx.cloud.init({
        env: env.cloudEnvId,
        traceUser: true
      })
    }
  },

  globalData: {
    cloudEnabled: Boolean(env.cloudEnvId)
  }
})
