import mongoose from 'mongoose';

const weatherCacheSchema = new mongoose.Schema(
  {
    locationKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    weatherData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    fetchedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index in MongoDB
    }
  }
);

const WeatherCache = mongoose.models.WeatherCache || mongoose.model('WeatherCache', weatherCacheSchema);

export default WeatherCache;
