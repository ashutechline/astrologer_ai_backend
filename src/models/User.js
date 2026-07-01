const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, trim: true, required: true, maxlength: 80 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // allows multiple docs with no email (pure social-only edge cases)
      index: true,
    },
    passwordHash: { type: String, select: false }, // absent for pure social-login users
    gender: { type: String, enum: ['male', 'female', 'nonbinary', 'unspecified'], default: 'unspecified' },
    avatarUrl: { type: String, default: null },
    locale: { type: String, default: 'en' },

    // Social login identifiers
    googleId: { type: String, index: true, sparse: true },
    appleId: { type: String, index: true, sparse: true },

    isGuest: { type: Boolean, default: false },

    // Preferences (Settings screen)
    preferences: {
      zodiacSystem: { type: String, enum: ['western', 'vedic', 'chinese'], default: 'western' },
      houseSystem: { type: String, enum: ['placidus', 'whole_sign', 'koch', 'equal'], default: 'placidus' },
      theme: { type: String, enum: ['light', 'dark', 'cosmic'], default: 'light' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      notifications: {
        dailyHoroscope: { type: Boolean, default: true },
        moonAlerts: { type: Boolean, default: true },
        retrogradeWarnings: { type: Boolean, default: true },
        communityActivity: { type: Boolean, default: true },
      },
    },

    // Subscription / entitlement state — mirrors RevenueCat, checked server-side on every gated route
    subscription: {
      isPro: { type: Boolean, default: false },
      productId: { type: String, default: null },
      revenueCatAppUserId: { type: String, index: true, sparse: true },
      expiresAt: { type: Date, default: null },
      willRenew: { type: Boolean, default: false },
      store: { type: String, enum: ['app_store', 'play_store', 'stripe', 'promotional', null], default: null },
    },

    fcmTokens: [{ type: String }], // device tokens for push notifications

    defaultChartId: { type: Schema.Types.ObjectId, ref: 'BirthChart', default: null },

    refreshTokenVersion: { type: Number, default: 0 }, // bump to invalidate all refresh tokens (logout-all / password change)
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    gender: this.gender,
    avatarUrl: this.avatarUrl,
    locale: this.locale,
    isGuest: this.isGuest,
    preferences: this.preferences,
    subscription: {
      isPro: this.subscription.isPro,
      expiresAt: this.subscription.expiresAt,
      willRenew: this.subscription.willRenew,
    },
    defaultChartId: this.defaultChartId,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
