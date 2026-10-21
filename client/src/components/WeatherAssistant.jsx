import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, Info } from 'lucide-react';
import { aiAPI } from '../services/api';

const QUICK_PROMPTS = [
  'Will it rain today?',
  'What should I wear?',
  'Should I carry an umbrella?',
  'Is today good for outdoor sports?',
  'Explain what current humidity means'
];

const WeatherAssistant = ({ isOpen, onClose, weatherContext }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: `Hello! I'm your WeatherSphere AI Assistant. I can analyze real-time meteorological data for ${weatherContext?.current?.city || 'your location'} to advise you on clothing, rainfall risk, humidity, or outdoor plans. Ask me anything!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeEngine, setActiveEngine] = useState('WeatherSphere Smart AI');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Update greeting when weather location changes
  useEffect(() => {
    if (weatherContext?.current?.city) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 1) {
          return [
            {
              id: 1,
              sender: 'assistant',
              text: `Hello! I'm your WeatherSphere AI Assistant. I'm actively analyzing real-time data for **${weatherContext.current.city}** (${weatherContext.current.tempC}°C, ${weatherContext.current.condition}). How can I assist you with your day?`,
              timestamp: new Date()
            }
          ];
        }
        return prev;
      });
    }
  }, [weatherContext?.current?.city]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({
        message: userMsg.text,
        weatherContext: weatherContext,
        chatHistory: messages.slice(-6)
      });

      if (res.data?.success) {
        if (res.data.engine) {
          setActiveEngine(res.data.engine);
        }
        const assistantMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: res.data.reply,
          engine: res.data.engine,
          timestamp: new Date(res.data.timestamp || Date.now())
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Sorry, I encountered an issue analyzing the weather data. Please try again or rephrase your question.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format bold and bullet points in text
  const formatAssistantText = (text) => {
    return text.split('\n').map((line, idx) => {
      // replace **text** with <strong>text</strong>
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={idx} style={{ display: 'block', minHeight: line === '' ? '0.5rem' : 'auto' }}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </span>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-backdrop" onClick={onClose}>
      <div className="glass-panel ai-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                WeatherSphere AI Assistant
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Powered by {activeEngine}
              </div>
            </div>
          </div>

          <button className="btn-icon" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Message History */}
        <div className="ai-chat-messages">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.sender}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '0.75rem', opacity: 0.8 }}>
                {m.sender === 'assistant' ? <Bot size={13} /> : <User size={13} />}
                <span>{m.sender === 'assistant' ? 'WeatherSphere AI' : 'You'}</span>
              </div>
              <div>{m.sender === 'assistant' ? formatAssistantText(m.text) : m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Analyzing weather data & forecast patterns...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div className="ai-quick-prompts">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="prompt-chip"
              onClick={() => handleSend(prompt)}
              disabled={loading}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          className="ai-input-box"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="form-input-control"
            placeholder="Ask anything about today's weather, rain, or clothes..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '0.75rem 1.25rem' }}
            disabled={loading || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default WeatherAssistant;
