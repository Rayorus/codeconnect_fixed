import React, { useState, useRef, useEffect } from 'react';

function AIMentor() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I am your AI Mentor. Ask me any programming question.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, something went wrong.' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <div style={{ minHeight: 400, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', padding: 16, marginBottom: 16, overflowY: 'auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '8px 0' }}>
            <span style={{ display: 'inline-block', background: msg.role === 'user' ? '#e0f7fa' : '#f1f8e9', padding: 8, borderRadius: 6 }}>{msg.content}</span>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', margin: '8px 0' }}>
            <span style={{ display: 'inline-block', background: '#f1f8e9', padding: 8, borderRadius: 6 }}>Thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form
        style={{ display: 'flex', gap: 8 }}
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          style={{ flex: 1, padding: 12, borderRadius: 6, border: '1px solid #ccc' }}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your programming question..."
        />
        <button style={{ padding: '0 16px', borderRadius: 6, background: '#00796b', color: '#fff', border: 'none' }} type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default AIMentor;
