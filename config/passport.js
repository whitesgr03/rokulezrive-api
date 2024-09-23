import passport from 'passport';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

import { Strategy as LocalStrategy } from 'passport-local';

const prisma = new PrismaClient();

passport.use(
	new LocalStrategy(
		{ usernameField: 'email' },

			match
				? done(null, {
						id: user.id,
						username: user.username,
				  })
				: done(null, false, 'The account could not be found.');
		} catch (err) {
			done(err);
		}
	})
);

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

export default passport;
