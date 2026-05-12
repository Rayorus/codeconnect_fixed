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
    <div className="max-w-2xl w-full mx-auto py-8 px-2 sm:px-4">
      <div className="min-h-[400px] bg-lc-card rounded-xl shadow-lg p-4 sm:p-6 mb-6 overflow-y-auto flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <span className={msg.role === 'user'
              ? 'bg-lc-accent text-lc-bg px-4 py-2 rounded-lg max-w-xs text-right'
              : 'bg-lc-bg text-lc-text px-4 py-2 rounded-lg max-w-xs text-left border border-lc-border'}>
              {msg.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <span className="bg-lc-bg text-lc-accent px-4 py-2 rounded-lg border border-lc-border">Thinking...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          className="flex-1 px-4 py-3 rounded-lg border border-lc-border bg-lc-bg text-lc-text focus:outline-none focus:ring-2 focus:ring-lc-accent"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your programming question..."
        />
        <button
          className="px-6 py-3 rounded-lg bg-lc-accent text-lc-bg font-semibold disabled:opacity-50"
          type="submit"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default AIMentor;
