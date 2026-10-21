import axios from 'axios';

/**
 * Intelligent Rule-Based AI Assistant Fallback
 * Analyzes real weather metrics to answer user questions
 */
const generateRuleBasedWeatherAdvice = (message, weatherContext) => {
  const q = message.toLowerCase();
  const current = weatherContext?.current || {};
  const hourly = weatherContext?.hourly || [];
  const daily = weatherContext?.daily || [];

  const city = current.city || 'your current location';
  const temp = current.tempC !== undefined ? `${current.tempC}°C (${current.tempF}°F)` : 'the current temperature';
  const feelsLike = current.feelsLikeC !== undefined ? `${current.feelsLikeC}°C (${current.feelsLikeF}°F)` : '';
  const condition = current.condition || 'clear';
  const humidity = current.humidity !== undefined ? current.humidity : 50;
  const wind = current.windSpeedKmh !== undefined ? current.windSpeedKmh : 10;
  const uv = current.uvIndex !== undefined ? current.uvIndex : 3;

  // Max pop (rain probability) in the next 12 hours
  const maxRainProb12h = hourly.slice(0, 4).reduce((max, h) => Math.max(max, h.pop || 0), 0);
  const willRainSoon = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle') || maxRainProb12h >= 40;

  // 1. Rain / Umbrella queries
  if (q.includes('rain') || q.includes('umbrella') || q.includes('shower') || q.includes('wet')) {
    if (willRainSoon) {
      const peakHour = hourly.find((h) => (h.pop || 0) >= 40);
      return `🌧️ **Yes, keep an umbrella handy in ${city}!**\n\nThe current condition is **${condition}** with a **${maxRainProb12h}% chance of precipitation** in the coming hours${peakHour ? ` (peaking around ${peakHour.time})` : ''}. Wearing waterproof footwear or carrying a compact umbrella is highly recommended.`;
    } else {
      return `☀️ **No umbrella needed right now in ${city}!**\n\nThe current condition is **${condition}** with low precipitation probability (${maxRainProb12h}%). You should be good to head out without rain gear today.`;
    }
  }

  // 2. What to wear queries
  if (q.includes('wear') || q.includes('clothes') || q.includes('jacket') || q.includes('dress') || q.includes('outfit')) {
    const tempNum = current.tempC ?? 20;
    let outfitAdvice = '';

    if (tempNum < 5) {
      outfitAdvice = 'A heavy winter coat, thermal innerwear, a warm scarf, and gloves are recommended.';
    } else if (tempNum < 15) {
      outfitAdvice = 'A medium-weight jacket, sweater, or fleece with long trousers.';
    } else if (tempNum < 24) {
      outfitAdvice = 'Light layers, a long-sleeve shirt or t-shirt with a light cardigan or denim jacket.';
    } else if (tempNum < 32) {
      outfitAdvice = 'Breathable lightweight cotton or linen clothes, sunglasses, and a sunhat.';
    } else {
      outfitAdvice = 'Ultra-light, loose-fitting, light-colored clothing. Stay in the shade where possible.';
    }

    let rainNote = willRainSoon ? ' Don\'t forget a waterproof layer or umbrella as rain is likely.' : '';
    let uvNote = uv >= 6 ? ` The UV index is high (${uv}), so wear sunscreen (SPF 30+) and sunglasses.` : '';

    return `👕 **Clothing Recommendation for ${city}:**\n\nWith current temperature at **${temp}** (feels like **${feelsLike}**) and **${condition}** skies:\n• ${outfitAdvice}${rainNote}${uvNote}`;
  }

  // 3. Outdoor activities / sports / running / cycling
  if (q.includes('outdoor') || q.includes('run') || q.includes('cycling') || q.includes('walk') || q.includes('hike') || q.includes('play')) {
    const tempNum = current.tempC ?? 20;
    let isSuitable = true;
    const reasons = [];

    if (willRainSoon) {
      isSuitable = false;
      reasons.push(`rain or wet surfaces likely (${maxRainProb12h}% chance)`);
    }
    if (tempNum > 33) {
      isSuitable = false;
      reasons.push(`excessive heat (${tempNum}°C) with risk of dehydration`);
    } else if (tempNum < 2) {
      isSuitable = false;
      reasons.push(`very cold conditions (${tempNum}°C)`);
    }
    if (wind > 35) {
      reasons.push(`gusty winds (${wind} km/h)`);
    }

    if (isSuitable && reasons.length === 0) {
      return `🏃‍♂️ **Great conditions for outdoor activities in ${city}!**\n\nConditions are pleasant: **${temp}**, **${condition}**, gentle breeze at **${wind} km/h**, and low rain chance (${maxRainProb12h}%). An ideal time for a jog, cycling, or an outdoor walk.`;
    } else {
      return `⚠️ **Caution for outdoor activities in ${city}:**\n\nConditions are less than ideal due to: **${reasons.join(', ')}**. If heading outdoors, take appropriate precautions, stay hydrated, or consider scheduling your session during a clearer window.`;
    }
  }

  // 4. Humidity explanation
  if (q.includes('humidity') || q.includes('sweat') || q.includes('muggy')) {
    let comfort = '';
    if (humidity < 30) {
      comfort = 'Dry air. May cause dry skin or throat irritation. Keep skin moisturized and drink plenty of water.';
    } else if (humidity <= 60) {
      comfort = 'Optimal human comfort zone (30% - 60%). Breathing feels natural and comfortable.';
    } else if (humidity <= 80) {
      comfort = 'Noticeably humid and muggy. Perspiration evaporates more slowly, making warm air feel hotter.';
    } else {
      comfort = 'Very high humidity. High moisture saturation in the air; light physical exertion will trigger heavy sweating.';
    }

    return `💧 **Humidity in ${city} is currently ${humidity}%:**\n\n${comfort}\n\n*Scientific Note:* Relative humidity measures how much water vapor is in the air compared to the maximum amount the air could hold at that temperature.`;
  }

  // 5. Tomorrow / 7-Day Forecast overview
  if (q.includes('tomorrow') || q.includes('next week') || q.includes('forecast') || q.includes('week')) {
    const tmrw = daily[1] || daily[0];
    if (tmrw) {
      return `📅 **Forecast for Tomorrow (${tmrw.dayName || 'Tomorrow'}, ${tmrw.date || ''}) in ${city}:**\n\n• **Condition:** ${tmrw.condition} (${tmrw.description || ''})\n• **High / Low:** ${tmrw.maxTempC}°C / ${tmrw.minTempC}°C (${tmrw.maxTempF}°F / ${tmrw.minTempF}°F)\n• **Precipitation Probability:** ${tmrw.pop}%\n• **Humidity:** ${tmrw.humidity}%\n\n${tmrw.pop >= 40 ? 'Pack rain gear as showers are probable.' : 'Enjoy a mostly pleasant forecast!'}`;
    }
  }

  // 6. UV / Sun protection
  if (q.includes('uv') || q.includes('sun') || q.includes('sunscreen') || q.includes('tan')) {
    let uvAdvice = '';
    if (uv <= 2) uvAdvice = 'Low risk: minimal sun protection required.';
    else if (uv <= 5) uvAdvice = 'Moderate risk: wear sunglasses and sunscreen if outdoors for extended periods.';
    else if (uv <= 7) uvAdvice = 'High risk: cover up, wear SPF 30+ sunscreen, a hat, and seek shade during midday hours.';
    else uvAdvice = 'Very High / Extreme risk: take extra precautions. Unprotected skin can burn quickly.';

    return `☀️ **UV Index in ${city} is ${uv}:**\n\n${uvAdvice}\nSunrise was at **${current.sunrise || 'morning'}** and sunset will be at **${current.sunset || 'evening'}**.`;
  }

  // Default intelligent assistant response
  return `🤖 **WeatherSphere Assistant Intelligence Report for ${city}:**\n\n• **Current Status:** ${temp}, ${condition}\n• **Feels Like:** ${feelsLike || temp}\n• **Wind & Humidity:** ${wind} km/h, ${humidity}%\n• **Precipitation Risk:** ${maxRainProb12h}%\n\n*Ask me specific questions like "Will it rain?", "What should I wear?", "Explain humidity", or "Is tomorrow good for running?"*`;
};

/**
 * Handle AI Assistant conversation
 */
export const askWeatherAssistant = async ({ message, weatherContext, chatHistory = [] }) => {
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty');
  }

  const aiApiKey = process.env.AI_API_KEY;

  // If external AI key is configured, try calling API
  if (aiApiKey && aiApiKey !== 'your_ai_provider_api_key') {
    try {
      // Connect to OpenAI or compatible API if key provided
      const systemPrompt = `You are WeatherSphere AI, a polite, accurate, and helpful weather assistant. 
Current weather context:
City: ${weatherContext?.current?.city || 'Unknown'}, ${weatherContext?.current?.country || ''}
Temperature: ${weatherContext?.current?.tempC}°C / ${weatherContext?.current?.tempF}°F
Condition: ${weatherContext?.current?.condition} (${weatherContext?.current?.description})
Humidity: ${weatherContext?.current?.humidity}%
Wind Speed: ${weatherContext?.current?.windSpeedKmh} km/h
UV Index: ${weatherContext?.current?.uvIndex}
Hourly rain chance: ${weatherContext?.hourly?.[0]?.pop || 0}%

Answer questions accurately based on this context. Never fabricate severe weather alerts or unsupported data.`;

      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory.slice(-4).map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: message }
          ],
          max_tokens: 350,
          temperature: 0.6
        },
        {
          headers: {
            Authorization: `Bearer ${aiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const reply = res.data?.choices?.[0]?.message?.content;
      if (reply) {
        return {
          reply,
          engine: 'AI Cloud Provider (OpenAI)',
          timestamp: new Date()
        };
      }
    } catch (err) {
      console.warn('External AI call failed or timed out. Falling back to rule-based engine:', err.message);
    }
  }

  // Fallback to WeatherSphere smart rule-based engine
  const reply = generateRuleBasedWeatherAdvice(message, weatherContext);
  return {
    reply,
    engine: 'WeatherSphere Smart Intelligence Engine',
    timestamp: new Date()
  };
};
