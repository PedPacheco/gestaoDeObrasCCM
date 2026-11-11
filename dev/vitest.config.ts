import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const TEST_UPLOADS = join(tmpdir(), 'sigo-test-uploads');

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
    testTimeout: 20_000,
    hookTimeout: 30_000,
    env: {
      DATABASE_URL:
        'postgresql://test:test@localhost:5432/test?schema=construcao_sp',
      UPLOAD_DEST: join(TEST_UPLOADS, 'viabilidade'),
      UPLOAD_AS_BUILD: join(TEST_UPLOADS, 'as_build'),
      UPLOAD_CAPEX_IMPORTS: join(TEST_UPLOADS, 'imports'),
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
