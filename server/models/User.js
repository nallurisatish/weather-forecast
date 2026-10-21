import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters']
    },
    googleId: {
      type: String,
      sparse: true,
      index: true
    },
    avatar: {
      type: String,
      default: ''
    },
    preferredTemperatureUnit: {
      type: String,
      enum: ['celsius', 'fahrenheit'],
      default: 'celsius'
    },
    preferredWindSpeedUnit: {
      type: String,
      enum: ['km/h', 'mph', 'm/s'],
      default: 'km/h'
    },
    favoriteCities: [
      {
        cityName: { type: String, required: true },
        country: { type: String, default: '' },
        latitude: { type: Number },
        longitude: { type: Number },
        addedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// Remove passwordHash from JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
