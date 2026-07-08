import { useState } from "react";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";

export function Browser() {
  const [url, setUrl] = useState("https://wikipedia.org");
  const [input, setInput] = useState("https://wikipedia.org");
  const t = useT();

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = input.trim();
    if (!finalUrl) return;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }
    setUrl(finalUrl);
    setInput(finalUrl);
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      {/* URL Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 p-2">
        <form onSubmit={handleGo} className="flex flex-1 items-center gap-2">
          <Icon name="search" size={16} className="text-text-dim" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim/50"
            placeholder="Type a URL..."
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="submit"
            className="rounded bg-accent/20 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/30"
          >
            GO
          </button>
        </form>
      </div>
      
      {/* Viewport */}
      <div className="flex-1 bg-white relative">
        <iframe
          src={url}
          className="absolute inset-0 h-full w-full border-none"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          title="Browser Viewport"
        />
      </div>
    </div>
  );
}
