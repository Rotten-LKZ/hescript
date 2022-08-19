import fs from 'fs'
import path from 'path'
import { config } from 'process'

const execPath = process.cwd()
const logger = {
  l: console.log,
  w: console.warn,
  e: console.error,
}

Array.prototype.toString = function() {
  return this.join(' | ')
}

console.log = function(...args) {
  logger.l(...args.map((value) => Array.isArray(value) ? value.toString() : value))
}

console.warn = function(...args) {
  logger.w(...args.map((value) => Array.isArray(value) ? value.toString() : value))
}

console.error = function(...args) {
  logger.e(...args.map((value) => Array.isArray(value) ? value.toString() : value))
}

/**
 * HeScript 配置
 */
export interface HeScriptConfig {
  rootDir?: string                    // HeScript 文件根目录，将会把目录下所有 .js .ts .he 进行解析
  outDir?: string                     // HeScript 文件输出目录，.js .he 将会输出 .js 文件，.ts 将会输出 .ts 文件，此配置仅为 rootDir 的输出
  files?: string[]                    // HeScript 文件，可同时指定多个，不限制文件后缀，除 .ts 文件输出 .ts 文件，其他后缀一律输出 .js 文件
  outFilesDir?: string                // HeScript 文件输出目录，此配置仅为 files 的输出
  mode?: 'Array' | 'Abbreviation'     // 模式设置，若为 Array 在检测是传入参数时将会直接传入 Array，否则将编译成多行传递参数
}

/**
 * 引入配置文件
 * @param filepath 路径
 */
export function importConfigFile(filepath: string) {
  try {
    const configStr = fs.readFileSync(path.resolve(execPath, filepath), { encoding: 'utf-8' })
    heScriptConfig(eval(`JSON.parse(JSON.stringify(${configStr.substring(configStr.indexOf('export default {') + 15, configStr.indexOf('} as HeScriptConfig') + 1)}))`))
  } catch (error) {
    logger.e(`无法导入配置文件\n${error}`)
  }
}

/**
 * 配置 HeScript
 * @param config HeScript 配置
 */
function heScriptConfig(config: HeScriptConfig) {
  if (!config.mode) config.mode = 'Array'
  if (config.rootDir) walkSync(config, '', handleHeScriptFiles)
  if (config.files) config.files.forEach((value) => {handleHeScriptFiles(value, config, 'files')})
}

function walkSync(config: HeScriptConfig, lastPath: string, callback: (filename: string, config: HeScriptConfig, input: 'rootDir' | 'files') => void) {
  fs.readdirSync(path.resolve(execPath, config.rootDir ?? '', lastPath), { withFileTypes: true }).forEach((dirent) => {
    const newPath = path.join(lastPath, dirent.name)
    if (dirent.isFile()) /\.(js|ts|he)$/i.test(dirent.name) ? callback(newPath, config, 'rootDir') : ''
    if (dirent.isDirectory()) walkSync(config, newPath, callback)
  })
}

function handleHeScriptFiles(filename: string, config: HeScriptConfig, input: 'rootDir' | 'files') {
  const outPath = 
    input === 'rootDir' ?
    path.resolve(execPath, (config.outDir ?? config.rootDir) ?? '', `${filename}${config.outDir ? '' : `-build${path.extname(filename)}`}`) :
    path.resolve(execPath, config.outFilesDir ?? '', `${filename}${config.outFilesDir ? '' : `-build${path.extname(filename)}`}`)

  fs.mkdirSync(path.resolve(outPath, '..'), { recursive: true })

  fs.writeFileSync(
    outPath,
    parseHeScript(
      fs.readFileSync(path.resolve(execPath, input === 'rootDir' ? config.rootDir ?? '' : '', filename), { encoding: 'utf-8' }),
      config
    )
  )
}

/**
 * 解析 HeScript
 * @param content HeScript 内容
 */
export function parseHeScript(content: string, config: HeScriptConfig): string {
  const lines = content.split('\n')
  const newLines: string[] = []

  for (let i = 0;i < lines.length;i++) {
    const lineValue = lines[i]

    const pureValue = lineValue.trim()
    const space = lineValue.substring(0, lineValue.indexOf(pureValue))

    // 判断是否为引入 hescript
    // if (/(require\(('|")hescript('|")\))|(from ('|")hescript('|"));?$/.test(lineValue)) continue
    
    // 数组赋值格式 xxx[0 | 1 | 2]
    if (/.+\[(\d+\s*\|\s*)*\d+\]/.test(lineValue)) {
      const indexStr = pureValue.substring(pureValue.indexOf('[') + 1, pureValue.indexOf(']'))
      const indexes = indexStr.split('|').map((value) => parseInt(value.trim()) - 1)
      newLines.push(indexes.map((value) => lineValue.replace(/\[(\d+\s*\|\s*)*\d+\]/, `[${value}]`)).join('\n'))
      continue
    }

    // 函数赋值格式 xxx(0 | 1 | 2)
    if (/.+\((\d+\s*\|\s*)*\d+.*\)/.test(lineValue)) {
      const indexStr = (pureValue.match(/(\d+\s*\|\s*)*\d+/) as string[])[0]
      const indexes = indexStr.split('|').map((value) => parseInt(value.trim()))
      if (config.mode === 'Abbreviation') newLines.push(indexes.map((value) => lineValue.replace(/\((\d+\s*\|\s*)*\d+/, `(${value}`)).join('\n'))
      if (config.mode === 'Array') newLines.push(lineValue.replace(/\((\d+\s*\|\s*)*\d+/, `([${indexes.join(', ')}]`))
      continue
    }

    newLines.push(lineValue)
  }

  return newLines.join('\n')
}

export default { importConfigFile, parseHeScript }
