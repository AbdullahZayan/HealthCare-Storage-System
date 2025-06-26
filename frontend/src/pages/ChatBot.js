import React, { useState, useRef, useEffect } from "react";
import { X as CloseIcon, Send as SendIcon } from "react-feather";
import { v4 as uuidv4 } from "uuid";

export default function Chatbot({ onClose, api }) {
  const sessionId = useRef(uuidv4()).current;
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

console.log("Chatbot initialized with session ID:", api);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function handleUserSubmit(e) {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setMessages((msgs) => [...msgs, { from: "user", text }]);
    setInputValue("");
    setTyping(true);

    try {
      const res = await fetch(`${api}/api/dialogflow/detectIntent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId }),
      });
      const { reply } = await res.json();
      setTyping(false);
      setMessages((msgs) => [...msgs, { from: "bot", text: reply }]);
    } catch (err) {
      setTyping(false);
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "😞 Oops, something went wrong." },
      ]);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-h-[600px] bg-white border border-gray-300 rounded-2xl shadow-xl flex flex-col z-[1000] font-sans">
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between text-base font-semibold">
        <div>Need Help? Chat with us</div>
        <button
          className="text-white hover:text-gray-200 text-lg focus:outline-none"
          onClick={onClose}
        >
          <CloseIcon size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 bg-gray-100 p-4 overflow-y-auto flex flex-col gap-2 custom-scrollbar"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[75%] px-4 py-2 rounded-xl text-sm leading-snug shadow ${
              msg.from === "bot"
                ? "bg-gray-200 text-gray-800 self-start rounded-bl-sm"
                : "bg-blue-500 text-white self-end rounded-br-sm"
            }`}
          >
            {msg.text}
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2 text-sm text-gray-500 self-start mb-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200"></div>
            <span>typing...</span>
          </div>
        )}
      </div>

      <form
        onSubmit={handleUserSubmit}
        className="border-t border-gray-200 bg-white p-3 flex gap-2 items-center"
      >
        <input
          type="text"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Type your question..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  );
}
