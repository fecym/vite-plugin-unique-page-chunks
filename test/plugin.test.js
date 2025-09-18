import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { uniquePageChunks } from '../src/index.js';
import { resolve } from 'path';

// 模拟 console.log 和 console.warn
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('vite-plugin-unique-page-chunks', () => {

  it('should generate correct chunk configuration', () => {
    // 创建插件实例，指向我们的模拟项目
    const plugin = uniquePageChunks({
      viewsDir: 'test/fixtures/mock-vite-project/src/views',
      chunkPrefix: 'page-',
      include: ['index.vue']
    });
    
    // 模拟 Vite 配置对象
    const config = { build: { rollupOptions: { output: {} } } };
    
    // 调用插件的 config 钩子
    plugin.config(config, { command: 'build' });
    
    // 验证生成的 manualChunks 配置
    const manualChunks = config.build.rollupOptions.output.manualChunks;
    
    // 应该有三个页面的 chunk
    expect(Object.keys(manualChunks)).toContain('page-pagea');
    expect(Object.keys(manualChunks)).toContain('page-pageb');
    expect(Object.keys(manualChunks)).toContain('page-pagec');
    
    // 验证每个 chunk 包含正确的文件
    expect(manualChunks['page-pagea']).toContainEqual(expect.stringContaining('PageA/index.vue'));
    expect(manualChunks['page-pageb']).toContainEqual(expect.stringContaining('PageB/index.vue'));
    expect(manualChunks['page-pagec']).toContainEqual(expect.stringContaining('PageC/index.vue'));
    
    // 验证组件文件被正确包含
    expect(manualChunks['page-pagea']).toContainEqual(expect.stringContaining('PageA/components/Header.vue'));
    expect(manualChunks['page-pageb']).toContainEqual(expect.stringContaining('PageB/components/Footer.vue'));
  });
  
  it('should respect exclude option', () => {
    // 创建插件实例，排除 PageC
    const plugin = uniquePageChunks({
      viewsDir: 'test/fixtures/mock-vite-project/src/views',
      chunkPrefix: 'page-',
      include: ['index.vue'],
      exclude: ['PageC']
    });
    
    const config = { build: { rollupOptions: { output: {} } } };
    plugin.config(config, { command: 'build' });
    
    const manualChunks = config.build.rollupOptions.output.manualChunks;
    
    // 应该只有两个页面的 chunk
    expect(Object.keys(manualChunks)).toContain('page-pagea');
    expect(Object.keys(manualChunks)).toContain('page-pageb');
    expect(Object.keys(manualChunks)).not.toContain('page-pagec');
  });
  
  it('should customize chunk file names', () => {
    // 创建插件实例，自定义 chunk 文件名
    const plugin = uniquePageChunks({
      viewsDir: 'test/fixtures/mock-vite-project/src/views',
      chunkPrefix: 'page-',
      include: ['index.vue'],
      chunkFileNames: {
        pageChunkPath: 'custom/[name]-[hash].js',
        defaultChunkPath: 'default/[name]-[hash].js'
      }
    });
    
    const config = { build: { rollupOptions: { output: {} } } };
    plugin.config(config, { command: 'build' });
    
    // 验证 chunkFileNames 函数
    const chunkFileNames = config.build.rollupOptions.output.chunkFileNames;
    expect(typeof chunkFileNames).toBe('function');
    
    // 测试页面 chunk
    expect(chunkFileNames({ name: 'page-pagea' })).toBe('custom/[name]-[hash].js');
    
    // 测试非页面 chunk
    expect(chunkFileNames({ name: 'vendor' })).toBe('default/[name]-[hash].js');
  });
});