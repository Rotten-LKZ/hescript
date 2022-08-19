# hescript

helang for JavaScript

## 介绍

来自 [kifuan/helang](https://github.com/kifuan/helang) 的启发，我想能不能拓展一下 JavaScript 的语法。也就是说这个项目完全可以在正常写 JavaScript 的时候稍微编译一下用了 helang 的 JavaScript 代码。

## 使用方法

1. 安装 hescript
```bash
pnpm i hescript -D
```

2. 新建配置文件 `hescript.config.ts`
```typescript
import type { HeScriptConfig } from 'hescript/src/index'

export default {
  rootDir: 'or-src',           // HeScript 文件根目录，将会把目录下所有 .js .ts .he 进行解析
  outDir: 'src',               // HeScript 文件输出目录，.js .he 将会输出 .js 文件，.ts 将会输出 .ts 文件，此配置仅为 rootDir 的输出
  files: ['a.js', 'b.js'],     // HeScript 文件，可同时指定多个，不限制文件后缀，除 .ts 文件输出 .ts 文件，其他后缀一律输出 .js 文件
  outFilesDir: 'files',        // HeScript 文件输出目录，此配置仅为 files 的输出
  mode: 'Array',               // 模式设置，可选值：Array 或 Abbreviation。若为 Array 在检测是传入参数时将会直接传入 Array，否则将编译成多行传递参数
} as HeScriptConfig
```

*注：如果 `mode` 设置成 `Abbreviation`，则 `pressCon(1 | 3 | 5, 10)` 这样的代码将会编译成：*

```javascript
pressCon(1, 10)
pressCon(3, 10)
pressCon(5, 10)
```

3. 执行 `hescript`
```bash
pnpm exec he
# or
npx exec he
```

也可以在 `package.json` 文件的 `scripts` 里面直接写 `he`

如果配置文件名不是执行目录下的 `hescript.config.ts`，则执行时传入配置文件目录 `path/to/hescript.config.ts`

4. 直接引入 `hescript`

欢迎在 `JavaScript` / `TypeScript` 里直接引入 `hescript` 比如：
```javascript
require('hescript')

console.log([1, 2, 3]) // 1 | 2 | 3
```
将会直接更改原型链为：
```typescript
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
```
这才是编程语言该有的样子

## 注意事项

1. 由于此项目暂时是字符串解析，并不是语法解析。所以仅支持一行内书写。

正确写法：
```javascript
let a = [1, 2, 3]
a[1 | 3] = 123 // 注意数组下标从 1 开始
```

错误写法：
```javascript
let a = [1, 2, 3];a[1 | 3] = 123;pressCon(1 | 2 | 3, 10);
```

2. 请按照所给的规范书写配置文件，因为配置文件的内容也是字符串解析

## 例子

```javascript
require('hescript')
function pressCon(key, force) {
  // if (config.mode === 'Array') console.log(Array.isArray(key)) // true
  // if (config.mode === 'Abbreviation') console.log(Array.isArray(key)) // false
}

pressCon(1    |3 |35|68 |  339911, 10)

let a = [1, 2, 3]

a[1 | 3] = 233

console.log(a) // 233 | 2 | 233
```
