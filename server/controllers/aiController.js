import { askWeatherAssistant } from '../services/aiService.js';

export const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, weatherContext, chatHistory } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A query message is required.'
      });
    }

    const result = await askWeatherAssistant({
      message: message.trim(),
      weatherContext,
      chatHistory: chatHistory || []
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
