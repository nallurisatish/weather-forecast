import mongoose from 'mongoose';

const savedCitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    cityName: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: ''
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Compound index to prevent duplicate saved cities per user
savedCitySchema.index({ userId: 1, cityName: 1 }, { unique: true });

const SavedCity = mongoose.models.SavedCity || mongoose.model('SavedCity', savedCitySchema);

export default SavedCity;
