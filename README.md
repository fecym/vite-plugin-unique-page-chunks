# Vite 页面组件唯一分块插件

## 🎯 插件简介

`vite-plugin-unique-page-chunks` 是一个自动化的Vite插件，专门解决 Vite 构建时对于同名组件（如多个 `index.vue`）生成的 chunk 命名冲突问题。

**问题背景**：Vite 默认会为每个组件生成对应的 JS 文件，但当项目中有多个同名文件（如不同目录下的 `index.vue`）时，它们会生成同名的 JS 文件，导致无法区分不同页面的 chunk。

**解决方案**：本插件自动扫描项目中指定的页面组件，并根据其所在目录名为每个页面生成带有唯一前缀的独立 chunk，无需手动配置。

**⚠️ 重要说明**：此插件仅在**生产环境构建**时生效，开发环境下不会进行代码分割，以保证开发时的热更新性能。

## ✨ 核心功能

### 🌟 Vite 8 / Rolldown 完美兼容
- 完美支持 Vite 8 最新底层打包器 Rolldown
- 自动转换及兼容旧版本 Vite 的 manualChunks 对象/函数配置

### 🔍 自动识别页面组件
- 自动扫描指定目录下的所有页面组件
- 支持自定义页面入口文件模式（默认：`index.vue`）
- 解决同名组件生成同名 chunk 的冲突问题

### 📦 智能命名与分组
- 根据目录名自动生成唯一的 chunk 名称
- 页面相关组件自动归入对应页面 chunk
- 支持自定义 chunk 命名前缀

### 🛠️ 灵活配置
- 支持自定义扫描目录
- 支持包含/排除特定文件
- 支持通配符匹配

## 🚀 快速开始

### 1. 安装使用

```bash
npm install vite-plugin-unique-page-chunks --save-dev
# 或者
yarn add vite-plugin-unique-page-chunks -D
# 或者
pnpm add vite-plugin-unique-page-chunks -D
```

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { uniquePageChunks } from 'vite-plugin-unique-page-chunks'

export default defineConfig({
  plugins: [
    vue(),
    uniquePageChunks({
      viewsDir: 'src/views',      // 页面目录（可自定义）
      chunkPrefix: 'page-',       // chunk名称前缀
      include: ['index.vue'],     // 包含的文件（可根据项目规范调整）
      exclude: [],                // 排除的页面
      chunkFileNames: {
        pageChunkPath: 'assets/js/pages/[name]-[hash].js',
        defaultChunkPath: 'assets/js/[name]-[hash].js'
      }
    })
  ]
})
```

### 2. 命名冲突问题示例

**问题示例**：

```txt
项目目录/
├── PageA/
│   └── index.vue              # 默认情况下生成 -> index.js
├── PageB/
│   └── index.vue              # 默认情况下也生成 -> index.js (命名冲突!)
└── PageC/
└── index.vue              # 默认情况下也生成 -> index.js (命名冲突!)
```


**使用插件后**：

```txt
dist/assets/js/pages/
├── page-pagea-a1b2c3d4.js     # PageA/index.vue 及其相关组件
├── page-pageb-e5f6g7h8.js     # PageB/index.vue 及其相关组件
└── page-pagec-i9j0k1l2.js     # PageC/index.vue 及其相关组件
```


## ⚙️ 配置选项

### 基础配置

```javascript
uniquePageChunks({
  // 页面目录路径（相对于项目根目录）
  viewsDir: 'src/views',
  
  // chunk名称前缀（用于区分不同页面的chunk）
  chunkPrefix: 'page-',
  
  // 包含的文件模式（用于识别页面入口）
  include: ['index.vue'],
  
  // 排除的页面目录
  exclude: ['components', 'shared'],
  
  // 自定义chunk文件命名配置
  chunkFileNames: {
    pageChunkPath: 'assets/js/pages/[name]-[hash].js',
    defaultChunkPath: 'assets/js/[name]-[hash].js'
  }
})
```

### 高级配置

```javascript
uniquePageChunks({
  // 适应不同项目结构
  viewsDir: 'src/pages',
  chunkPrefix: 'route-',
  
  // 支持通配符匹配，适应不同命名规范
  include: ['*.vue', 'main.vue', 'Page.vue'],
  
  // 排除特定页面
  exclude: ['admin', 'test']
})
```

## 🎨 适应不同项目规范

### 1. 适应不同的目录结构

插件可以适应各种项目结构，只需调整配置：

```javascript
// 标准 Vue 项目
uniquePageChunks({ viewsDir: 'src/views' })

// Nuxt 风格项目
uniquePageChunks({ viewsDir: 'src/pages' })

// 自定义结构
uniquePageChunks({ viewsDir: 'src/modules' })
```

### 2. 适应不同的文件命名规范

插件支持多种文件命名规范，通过 `include` 配置：

```javascript
// index.vue 作为入口
uniquePageChunks({ include: ['index.vue'] })

// [name].page.vue 作为入口
uniquePageChunks({ include: ['*.page.vue'] })

// 多种可能的入口文件
uniquePageChunks({ include: ['index.vue', 'main.vue', '*.page.vue'] })
```

### 3. 排除特定页面或目录

```javascript
uniquePageChunks({
  exclude: ['admin', 'components', 'utils']  // 这些目录不会生成独立chunk
})
```

## 📊 性能优势

### 🚀 构建优势

| 对比项 | Vite 默认行为 | 使用本插件 |
|--------|----------|----------|
| **chunk命名** | 同名冲突 | 唯一命名 |
| **可读性** | 低（无法区分页面） | 高（清晰的页面前缀） |
| **缓存效率** | 低（更新一个页面可能影响多个） | 高（页面独立缓存） |
| **维护成本** | 高（需手动配置） | 低（自动处理） |

### 📈 运行时性能

- ✅ **按需加载**：每个页面独立chunk，访问时才加载
- ✅ **缓存优化**：页面独立更新，不影响其他页面缓存
- ✅ **并行加载**：多个页面可以并行预加载
- ✅ **体积优化**：避免不必要的代码打包

## 🛠️ 调试和监控

### 1. 构建日志

插件会在构建时输出详细信息：

```txt
🚀 [unique-page-chunks] 自动生成了 6 个页面chunks:
   - page-pagea
   - page-pageb
   - page-pagec
   - page-paged
   - page-pagee
   - page-pagef
📁 [unique-page-chunks] 页面chunk将保存到: assets/js/pages/[name]-[hash].js
```

### 2. 分析工具

结合 `rollup-plugin-visualizer` 查看chunk分析：

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    uniquePageChunks(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ]
})
```

访问 `dist/stats.html` 查看详细的chunk分析报告。

## 🔧 故障排除

### 常见问题

**Q: 某个页面没有生成独立chunk？**

A: 检查页面目录下是否有符合 `include` 配置的文件，或者该页面是否在 `exclude` 列表中。

**Q: 页面相关组件没有包含在对应chunk中？**

A: 检查组件是否位于正确的子目录中，插件会自动包含 `components/`、`composables/` 和 `utils/` 子目录中的文件。

**Q: 插件报错无法扫描目录？**

A: 检查 `viewsDir` 配置是否正确，目录是否存在。

**Q: 为什么开发环境中看不到效果？**

A: 插件仅在生产环境构建时生效，开发环境下不会进行代码分割，以保证热更新性能。

## 📝 总结

使用 `vite-plugin-unique-page-chunks` 插件，你可以：

- ✅ **解决命名冲突**：不同页面的同名组件生成唯一命名的 chunk
- ✅ **适应不同规范**：灵活配置适应各种项目结构和命名规范
- ✅ **零配置维护**：添加新页面无需修改配置
- ✅ **自动化处理**：智能扫描和chunk生成
- ✅ **高性能构建**：优化的代码分割策略

这个插件完美解决了 Vite 默认构建中同名组件生成同名 chunk 的问题，让你的项目构建更加清晰、高效！
