interface ChunkFileNames {
  pageChunkPath: string;
  defaultChunkPath: string;
}

interface UniqueChunksOptions {
  /**
   * 页面目录路径（相对于项目根目录）
   * @default 'src/views'
   */
  viewsDir?: string;
  
  /**
   * chunk名称前缀（用于区分不同页面的chunk）
   * @default 'page-'
   */
  chunkPrefix?: string;
  
  /**
   * 包含的文件模式（用于识别页面入口）
   * @default ['index.vue']
   */
  include?: string[];
  
  /**
   * 排除的页面目录
   * @default []
   */
  exclude?: string[];
  
  /**
   * 自定义chunk文件命名配置
   * @default { pageChunkPath: 'assets/js/pages/[name]-[hash].js', defaultChunkPath: 'assets/js/[name]-[hash].js' }
   */
  chunkFileNames?: ChunkFileNames;
}

/**
 * Vite 页面组件唯一分块插件
 * 自动扫描页面目录，为每个页面生成独立的 chunk
 */
export function uniquePageChunks(options?: UniqueChunksOptions): Plugin;

export default uniquePageChunks;