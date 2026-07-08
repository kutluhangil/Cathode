import { useState, useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/useT";
import { Icon } from "@/components/icons";

const HOME_URL = "retro://home";

function StartPage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onNavigate(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#c0c0c0] text-black font-sans selection:bg-[#0000aa] selection:text-white">
      <div className="p-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-4xl font-serif text-[#0000aa] mb-2 font-bold tracking-widest" style={{ textShadow: "2px 2px 0px #fff" }}>RETRO_WEB</h1>
          <p className="text-sm italic">The Information Superhighway Directory</p>
        </div>

        <div className="bg-[#dfdfdf] border-2 border-white border-b-[#808080] border-r-[#808080] p-4 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 items-center">
            <span className="font-bold text-sm">Search Encyclopedia:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-2 border-[#808080] border-b-white border-r-white bg-white px-2 py-1 text-black outline-none"
            />
            <button
              type="submit"
              className="border-2 border-white border-b-[#808080] border-r-[#808080] bg-[#c0c0c0] px-4 py-1 font-bold active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white active:bg-[#dfdfdf]"
            >
              Search
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="bg-[#0000aa] text-white px-2 py-1 font-bold mb-2">Web Directory</h2>
            <ul className="list-disc list-inside space-y-1 text-blue-800 underline">
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://en.wikipedia.org/wiki/Main_Page")}>Wikipedia (Encyclopedia)</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://wttr.in/")}>Weather Report (wttr.in)</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://text.npr.org/")}>NPR News (Text Only)</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://brutalist.report/")}>Brutalist Report (News)</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://motherfuckingwebsite.com/")}>Motherfucking Website</button>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="bg-[#0000aa] text-white px-2 py-1 font-bold mb-2">Tech & Tools</h2>
            <ul className="list-disc list-inside space-y-1 text-blue-800 underline">
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://lite.cnn.com/")}>CNN Lite</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://hackernews.betacat.io/")}>Hacker News (Retro UI)</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://js13kgames.com/")}>JS13K Games</button>
              </li>
              <li>
                <button className="hover:text-red-600" onClick={() => onNavigate("https://xkcd.com/")}>XKCD Comics</button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 text-center text-xs text-[#808080]">
          <p>Note: Many modern websites block iframe embedding (X-Frame-Options).<br/>The sites listed above are known to work in this vintage browser.</p>
          <div className="mt-4 border-t border-[#808080] pt-4">
            <marquee className="text-[#0000aa] font-bold">Welcome to the World Wide Web! Best viewed in 800x600 resolution.</marquee>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Browser() {
  const [history, setHistory] = useState<string[]>([HOME_URL]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [input, setInput] = useState(HOME_URL);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const t = useT();

  const currentUrl = history[historyIdx];

  // Sync input with current URL when history changes
  useEffect(() => {
    setInput(currentUrl);
  }, [currentUrl]);

  const navigateTo = (newUrl: string) => {
    let finalUrl = newUrl.trim();
    if (!finalUrl) return;

    if (finalUrl !== HOME_URL) {
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith("retro://")) {
        // If it doesn't look like a URL (no dot, no space), search Wikipedia
        if (!finalUrl.includes(".") || finalUrl.includes(" ")) {
          finalUrl = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(finalUrl)}`;
        } else {
          finalUrl = "https://" + finalUrl;
        }
      }
    }

    if (finalUrl === currentUrl) {
      reload();
      return;
    }

    const newHistory = history.slice(0, historyIdx + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIdx(newHistory.length - 1);
    setIsLoading(true);
  };

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(input);
  };

  const goBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx(historyIdx - 1);
      setIsLoading(true);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(historyIdx + 1);
      setIsLoading(true);
    }
  };

  const goHome = () => navigateTo(HOME_URL);
  
  const reload = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      // Force iframe to reload by resetting its src
      const src = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src;
      }, 50);
    } else {
      setIsLoading(false);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    try {
      if (iframeRef.current?.contentWindow) {
        const iframeUrl = iframeRef.current.contentWindow.location.href;
        if (iframeUrl.includes("/api/proxy?url=")) {
          const urlParams = new URL(iframeUrl).searchParams;
          const actualUrl = urlParams.get("url");
          if (actualUrl && actualUrl !== currentUrl) {
            const newHistory = history.slice(0, historyIdx + 1);
            newHistory.push(actualUrl);
            setHistory(newHistory);
            setHistoryIdx(newHistory.length - 1);
          }
        }
      }
    } catch (e) {
      // Ignore cross-origin errors if any
    }
  };

  const isHome = currentUrl === HOME_URL;

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Toolbar */}
      <div className="flex flex-col border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-1 p-2 border-b border-white/5">
          <button
            onClick={goBack}
            disabled={historyIdx === 0}
            className="rounded p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Back"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            onClick={goForward}
            disabled={historyIdx === history.length - 1}
            className="rounded p-1.5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="Forward"
            style={{ transform: "scaleX(-1)" }}
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <button
            onClick={reload}
            className="rounded p-1.5 hover:bg-white/10"
            title="Reload"
          >
            <Icon name="refresh" size={16} />
          </button>
          <button
            onClick={goHome}
            className="rounded p-1.5 hover:bg-white/10 mr-1"
            title="Home"
          >
            <Icon name="monitor" size={16} />
          </button>

          <form onSubmit={handleGo} className="flex flex-1 items-center gap-2 rounded bg-black/40 px-2 py-1 border border-white/10 focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all">
            <Icon name="search" size={14} className="text-text-dim" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-dim/50 font-mono"
              placeholder="Enter URL or search term..."
              autoComplete="off"
              spellCheck="false"
            />
          </form>
        </div>
        
        {/* Bookmarks Bar */}
        <div className="flex items-center gap-3 px-3 py-1 text-xs text-text-dim">
          <span className="font-semibold text-text/70">Bookmarks:</span>
          <button className="hover:text-accent hover:underline flex items-center gap-1" onClick={() => navigateTo("https://en.wikipedia.org/wiki/Main_Page")}>
            <Icon name="doc" size={12} /> Wikipedia
          </button>
          <button className="hover:text-accent hover:underline flex items-center gap-1" onClick={() => navigateTo("https://wttr.in/")}>
            <Icon name="bird" size={12} /> Weather
          </button>
          <button className="hover:text-accent hover:underline flex items-center gap-1" onClick={() => navigateTo("https://text.npr.org/")}>
            <Icon name="file" size={12} /> News
          </button>
        </div>
      </div>
      
      {/* Viewport */}
      <div className="flex-1 relative bg-[#c0c0c0]">
        {isLoading && !isHome && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-bg/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-accent animate-pulse">
              <Icon name="refresh" size={24} className="animate-spin" />
              <span className="font-mono text-sm tracking-widest">LOADING...</span>
            </div>
            <span className="text-xs text-text-dim mt-2 max-w-xs text-center">
              If the page stays gray, the website may block embedding (X-Frame-Options).
            </span>
          </div>
        )}

        {isHome ? (
          <StartPage onNavigate={navigateTo} />
        ) : (
          <iframe
            ref={iframeRef}
            src={`/api/proxy?url=${encodeURIComponent(currentUrl)}`}
            onLoad={handleIframeLoad}
            className="absolute inset-0 h-full w-full border-none bg-white"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="Browser Viewport"
          />
        )}
      </div>
    </div>
  );
}
