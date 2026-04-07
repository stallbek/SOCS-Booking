const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return v.endsWith('@mcgill.ca') || v.endsWith('@mail.mcgill.ca');
      },
      message: 'Only McGill email addresses (@mcgill.ca or @mail.mcgill.ca) are allowed.'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Role derived from email: @mcgill.ca = owner (professor/TA), @mail.mcgill.ca = user (student)
  role: {
    type: String,
    enum: ['owner', 'user'],
    required: true
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Derive role from email domain
userSchema.pre('validate', function (next) {
  if (this.email) {
    this.role = this.email.endsWith('@mcgill.ca') ? 'owner' : 'user';
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
