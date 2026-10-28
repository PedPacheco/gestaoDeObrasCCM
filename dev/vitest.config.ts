import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // esbuild (padrão do Vite) não emite emitDecoratorMetadata, que o NestJS
    // precisa para injeção de dependência por tipo. O SWC resolve isso.
    swc.vite({ module: { type: 'es6' } }),
  ],
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
    },
  },
  test: {
    env: {
      DATABASE_URL:
        'postgresql://test:test@localhost:5432/test?schema=construcao_sp',
    },
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/infra/generated/**', 'src/**/types/**'],
      reportsDirectory: './coverage',
    },
  },
});
