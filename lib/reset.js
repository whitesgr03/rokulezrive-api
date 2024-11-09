import { prisma } from './prisma';

export const seeding = async () => {
	const users = [
		{
			id: '1',
			email: 'test@gmail.com',
			folders: {
				create: [
					{
						name: 'My Drive',
					},
				],
			},
		},
		{
			id: '2',
			email: 'user@gmail.com',
			folders: {
				create: [
					{
						name: 'My Drive',
					},
				],
			},
		},
	];
	await prisma.$transaction(users.map(data => prisma.user.create({ data })));
};

export const resetDb = async () => {
	await prisma.$transaction([prisma.user.deleteMany()]);
};
