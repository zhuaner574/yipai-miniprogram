# 微信云开发接入清单

## 需要创建的集合

### profiles

- nickname: string
- level: string
- experience: string
- goals: string[]
- tone: string
- handedness: string（选填）
- weeklyFrequency: string（选填）
- practiceMode: string[]（选填）
- primaryMotivation: string[]（选填）
- playPartner: string[]（选填）
- matchExperience: string（选填）
- challenges: string[]（选填，最多 3 项）
- registeredAt: datetime string
- updatedAt: datetime string
- `_openid`: 由云开发自动写入

### sessions

- id: string
- date: `YYYY-MM-DD`
- startTime: `HH:mm`
- type: `rally | lesson | machine | match`
- duration: number
- mood: `great | progress | calm | tired | frustrated`
- issue: string（多个困扰的兼容展示文本）
- issues: array（用户选择的多个困扰标签）
- diary: string
- matchLevel: string
- matchFormat: `single | tournament`
- matchResult: `win | loss`（选填）
- matchCount: number（多轮比赛选填）
- placement: string（多轮比赛选填）
- score: string
- reply: object
- createdAt: datetime string
- `_openid`: 由云开发自动写入

### feedback

- useful: string
- comment: string
- createdAt: datetime string
- `_openid`: 由云开发自动写入

### events

- name: string
- properties: object
- createdAt: datetime string
- `_openid`: 由云开发自动写入

## 权限原则

四个集合都采用“仅创建者可读写”。用户日记、比赛结果和负面情绪均属于个人数据，不允许公开读取。

## 云函数

- `login`：获取当前用户身份，用于登录连通性检查
- `deleteAccountData`：从微信上下文读取当前用户 OpenID，仅删除该用户在 `sessions`、`feedback`、`events`、`profiles` 中的数据

两个云函数都需要在微信开发者工具中右键选择“上传并部署 云端安装依赖”。删除函数不得接受前端传入的 OpenID，避免越权删除。

## 上线前检查

- 隐私指引明确列出昵称、网球画像、训练记录、比赛结果、心情、日记的使用目的
- 提供数据删除入口
- 不采集手机号、精确位置和通讯录
- 不在小程序前端存放任何模型 API Key 或 AppSecret
- 大模型调用必须经过云函数，并对输入输出做安全处理
