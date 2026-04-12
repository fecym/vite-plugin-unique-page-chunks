import {relative, resolve} from 'path'
import {readdirSync, statSync} from 'fs'

/**
 * 自动页面chunk插件
 * 自动扫描views目录，为每个页面生成独立的chunk
 */
export function uniquePageChunks(options = {}) {
  const {
    viewsDir = 'src/views',
    chunkPrefix = 'page-',
    include = ['index.vue'],
    exclude = [],
    // 新增：自定义chunk文件命名配置
    chunkFileNames = {
      pageChunkPath: 'assets/js/pages/[name]-[hash].js', // 页面chunk路径
      defaultChunkPath: 'assets/js/[name]-[hash].js'     // 其他chunk路径
    },
    pluginPriority = true // true: 插件优先, false: 用户配置优先
  } = options

  return {
    name: 'vite-plugin-unique-page-chunks',

    config(config, {command}) {
      if (command !== 'build') return
      // 扫描views目录，自动生成manualChunks配置
      const chunks = scanPageChunks(viewsDir, chunkPrefix, include, exclude)

      if (!config.build) config.build = {}
      if (!config.build.rollupOptions) config.build.rollupOptions = {}
      if (!config.build.rollupOptions.output) config.build.rollupOptions.output = {}

      // 合并现有的manualChunks配置
      const existingChunks = config.build.rollupOptions.output.manualChunks

      const getPageChunkName = (id) => {
        // 去除 id 中的 query 参数（如 ?vue&type=style）
        const cleanId = id.split('?')[0];
        // 获取相对于项目根目录的路径
        const relativePath = `./${relative(process.cwd(), cleanId).replace(/\\/g, '/')}`;

        // 遍历chunks对象，检查文件是否在某个chunk的文件列表中
        for (const [chunkName, files] of Object.entries(chunks)) {
          if (files.includes(relativePath)) {
            return chunkName;
          }
        }
        
        return null;
      };

      const getExistingObjectChunkName = (id, existingObj) => {
        if (!existingObj) return null;
        const cleanId = id.split('?')[0];
        const relativePath = `./${relative(process.cwd(), cleanId).replace(/\\/g, '/')}`;
        
        for (const [chunkName, files] of Object.entries(existingObj)) {
          if (Array.isArray(files) && files.includes(relativePath)) {
            return chunkName;
          }
        }
        return null;
      };

      config.build.rollupOptions.output.manualChunks = (id, meta) => {
        const pluginResult = getPageChunkName(id);
        
        let userResult = null;
        if (typeof existingChunks === 'function') {
          userResult = existingChunks(id, meta);
        } else if (existingChunks && typeof existingChunks === 'object') {
          userResult = getExistingObjectChunkName(id, existingChunks);
        }

        if (pluginPriority) {
          return pluginResult || userResult;
        } else {
          return userResult || pluginResult;
        }
      };

      // 处理 chunkFileNames 配置
      const existingChunkFileNames = config.build.rollupOptions.output.chunkFileNames;
      
      // 创建一个处理页面chunk的函数
      const getChunkFileName = (chunkInfo) => {
        if (chunkInfo?.name.startsWith(chunkPrefix)) {
          return chunkFileNames.pageChunkPath;
        }
        return null; // 不是页面chunk
      };
      
      // 根据现有配置类型处理
      if (typeof existingChunkFileNames === 'function') {
        // 如果已有函数配置，保留原有逻辑并添加页面chunk处理
        const originalFn = existingChunkFileNames;
        config.build.rollupOptions.output.chunkFileNames = (chunkInfo) => {
          return getChunkFileName(chunkInfo) || originalFn(chunkInfo);
        };
      } else if (typeof existingChunkFileNames === 'string') {
        // 如果已有字符串配置，创建函数来处理
        config.build.rollupOptions.output.chunkFileNames = (chunkInfo) => {
          return getChunkFileName(chunkInfo) || existingChunkFileNames;
        };
      } else {
        // 没有现有配置，使用插件的配置
        config.build.rollupOptions.output.chunkFileNames = (chunkInfo) => {
          return getChunkFileName(chunkInfo) || chunkFileNames.defaultChunkPath;
        };
      }

      console.log(`🚀 [unique-page-chunks] 自动生成了 ${Object.keys(chunks).length} 个页面chunks:`)
      Object.keys(chunks).forEach(chunkName => {
        console.log(`   - ${chunkName}`)
      })
      console.log(`📁 [unique-page-chunks] 页面chunk将保存到: ${chunkFileNames.pageChunkPath}`)
    }
  }
}

/**
 * 扫描页面目录，生成chunks配置
 */
function scanPageChunks(viewsDir, chunkPrefix, include, exclude) {
  const chunks = {}
  const viewsPath = resolve(process.cwd(), viewsDir)

  try {
    const dirs = readdirSync(viewsPath)
    dirs.forEach(dir => {
      const dirPath = resolve(viewsPath, dir)

      // 跳过文件，只处理目录
      if (!statSync(dirPath).isDirectory()) return

      // 检查是否在排除列表中
      if (exclude.includes(dir)) return

      // 查找目录中的页面文件
      const files = readdirSync(dirPath)
      const pageFiles = files.filter(file =>
        include.some(pattern => {
          if (pattern.includes('*')) {
            // 支持通配符匹配
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            return regex.test(file)
          }
          return file === pattern
        })
      )

      if (pageFiles.length > 0) {
        const chunkName = `${chunkPrefix}${dir.toLowerCase()}`
        chunks[chunkName] = pageFiles.map(file =>
          `./${viewsDir}/${dir}/${file}`.replace(/\\/g, '/')
        )

        // 同时包含该页面目录下的所有组件和 composables
        const subDirs = ['components', 'composables', 'utils']
        subDirs.forEach(subDir => {
          const subDirPath = resolve(dirPath, subDir)
          try {
            if (statSync(subDirPath).isDirectory()) {
              const subFiles = getAllVueFiles(subDirPath)
              subFiles.forEach(subFile => {
                const relativePath = relative(process.cwd(), subFile).replace(/\\/g, '/')
                chunks[chunkName].push(`./${relativePath}`)
              })
            }
          } catch (e) {
            // 子目录不存在，跳过
          }
        })
      }
    })
  } catch (error) {
    console.warn(`⚠️  [unique-page-chunks] 无法扫描目录 ${viewsDir}:`, error.message)
  }
  return chunks
}

/**
 * 递归获取目录下所有Vue文件
 */
function getAllVueFiles(dir) {
  const files = []

  try {
    const items = readdirSync(dir)

    items.forEach(item => {
      const itemPath = resolve(dir, item)
      const stat = statSync(itemPath)

      if (stat.isDirectory()) {
        files.push(...getAllVueFiles(itemPath))
      } else if (item.endsWith('.vue') || item.endsWith('.js') || item.endsWith('.ts')) {
        files.push(itemPath)
      }
    })
  } catch (error) {
    // 忽略错误，继续处理其他文件
  }
  return files
}

export default uniquePageChunks