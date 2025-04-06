import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['__test__/integration/**.test.js'],
		exclude: ['__test__/integration/example_**.test.js'],
		setupFiles: ['__test__/integration/setup.js'],
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		fileParallelism: false,
	},
});
