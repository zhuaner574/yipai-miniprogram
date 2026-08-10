const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(fullPath)
    return [fullPath]
  })
}

const files = walk(root).filter(file => !file.includes(`${path.sep}node_modules${path.sep}`))

files.filter(file => file.endsWith('.json')).forEach(file => {
  assert.doesNotThrow(
    () => JSON.parse(fs.readFileSync(file, 'utf8')),
    undefined,
    `${path.relative(root, file)} must contain valid JSON`
  )
})

const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
appConfig.pages.forEach(pagePath => {
  ;['js', 'json', 'wxml', 'wxss'].forEach(extension => {
    assert.ok(fs.existsSync(path.join(root, `${pagePath}.${extension}`)), `${pagePath}.${extension} is missing`)
  })
})

files.filter(file => file.endsWith('.wxml')).forEach(file => {
  const content = fs.readFileSync(file, 'utf8')
  const references = [...content.matchAll(/(?:src|poster)=["'](\/assets\/[^"']+)["']/g)]
  references.forEach(([, asset]) => {
    assert.ok(fs.existsSync(path.join(root, asset)), `${asset} referenced by ${path.relative(root, file)} is missing`)
  })
})

const projectConfig = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'))
assert.equal(projectConfig.cloudfunctionRoot, 'cloudfunctions/')
assert.ok(projectConfig.appid, 'an AppID or touristappid is required')

;['login', 'deleteAccountData'].forEach(name => {
  assert.ok(fs.existsSync(path.join(root, 'cloudfunctions', name, 'index.js')), `${name} cloud function is missing`)
  assert.ok(fs.existsSync(path.join(root, 'cloudfunctions', name, 'package.json')), `${name} package is missing`)
})

const envSource = fs.readFileSync(path.join(root, 'config', 'env.js'), 'utf8')
assert.match(envSource, /cloudEnvId:\s*['"][^'"]*['"]/, 'cloudEnvId configuration key is required')

files.filter(file => /\.(js|json)$/.test(file)).forEach(file => {
  const content = fs.readFileSync(file, 'utf8')
  assert.doesNotMatch(content, /AppSecret\s*[:=]\s*['"][^'"]+['"]/i, `${path.relative(root, file)} may contain an AppSecret`)
})

console.log('All preflight structure and configuration checks passed.')
