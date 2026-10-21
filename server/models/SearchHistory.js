import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
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
    },
    searchedAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days retention limit
    }
  }
);

searchHistorySchema.index({ userId: 1, searchedAt: -1 });

const SearchHistory = mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
