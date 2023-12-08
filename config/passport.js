const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const i18n = require('../config/i18n');

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  async (req, email, password, done) => {
    try {
      // Find a user by email
      const user = await User.findOne({ where: { email } });

      // No user found with the given email
      if (!user) {
        return done(null, false, { message: i18n.__('validation.incorrect_credentials') });
      }

      // Verify the password
      const isPasswordValid = await user.validPassword(password);
      
      // Password does not match
      if (!isPasswordValid) {
        return done(null, false, { message: i18n.__('validation.incorrect_credentials') });
      }
      
      // User authentication successful
      return done(null, user);
    } catch (error) {
      // An exception was caught, pass it to the done callback
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      // No user found with that ID, pass an error to the done callback
      return done(new Error(i18n.__('error.user_not_found')));
    }
    done(null, user);
  } catch (error) {
    // An exception was caught, pass it to the done callback
    done(error);
  }
});
