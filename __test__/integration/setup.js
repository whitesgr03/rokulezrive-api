import { beforeEach, vi } from 'vitest';
import { resetDb, seeding } from '../../lib/reset';

beforeEach(async () => {
	vi.clearAllMocks();
	await resetDb();
	await seeding();
});
