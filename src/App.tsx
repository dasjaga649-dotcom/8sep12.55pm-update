import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { marked } from 'marked';
import './App.css';
import { jsPDF } from 'jspdf';
import { Document as DocxDocument, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType, HeadingLevel, TextRun, ImageRun } from 'docx';
import { User, Building, Settings, Briefcase, BarChart, Trophy, Laptop, Phone, Mail, RefreshCw } from "lucide-react";
import gifOverrides, { GifOverridesMap, GifOverride } from './gif-overrides';
import lottie from 'lottie-web';

// Chat loading animation using Lottie
const LoadingAnimation: React.FC<{ className?: string; src?: string; direction?: 'left' | 'right' }> = ({ className, src, direction = 'right' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let anim: ReturnType<typeof lottie.loadAnimation> | null = null;
    let cancelled = false;
    const url = src || 'https://cdn.builder.io/o/assets%2F53d4e9f16f794d438e3fbb8ee6709fb8%2F71e792acb32c41d8b2390e222e9d80f8?alt=media&token=1dc9711e-aec0-4e92-9171-4c6922ab704c&apiKey=53d4e9f16f794d438e3fbb8ee6709fb8';

    const load = async () => {
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled || !containerRef.current) return;
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: data
        });
      } catch {
        // silently fail
      }
    };
    load();
    return () => { cancelled = true; if (anim) { anim.destroy(); anim = null; } };
  }, [src]);

  return (
    <div className={className || 'chat-loader-inline'} aria-hidden="true">
      <div ref={containerRef} className={`lottie-loader ${direction === 'right' ? 'lottie-direction-right' : ''}`} role="status" aria-label="Loading" />
    </div>
  );
};

// Configure marked for better rendering and security
marked.setOptions({
  async: false,
  breaks: true, // Convert line breaks to <br>
  gfm: true // GitHub Flavored Markdown
});

type ErrorKind = 'offline' | 'network_failed' | 'http_404' | 'http_5xx' | 'json_parse_error' | 'unknown_error';

const ERROR_GIFS: Record<ErrorKind, string> = {
  offline: 'https://media.tenor.com/aWgYsZpFShUAAAAi/brawl-star-brawl-stars.gif',
  network_failed: 'https://media.tenor.com/aWgYsZpFShUAAAAi/brawl-star-brawl-stars.gif',
  http_404: 'https://www.dochipo.com/wp-content/uploads/2024/01/404-Error-Animation-4.gif',
  http_5xx: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExZGljYnpscmlodGs2N3VrOG1ob2kxbDlldnJvNHY5bmZ4d3ZmMmU5aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/0Dxuk20eU0bDYaxRR8/giphy.gif',
  json_parse_error: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExd3g0NHVmYXBwNXowb3MzMngyeGJvN2t3cTZ1YWR4OHBhYndpcWkwZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nIlgTxY29wJuU/giphy.gif',
  unknown_error: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHR6dW01M2xoZGp5M3hkdzhiZHg3M2xueTM5dDV2aGFta2JxZmllNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/XftgiBWR1ya5FswTSE/giphy.gif'
};

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  response?: BotResponse;
  query?: string; // Store the original user question for bot messages
  errorKind?: ErrorKind;
  contactForm?: boolean; // render inline contact form in chat
}

interface BotResponse {
  answer: string;
  related_content?: RelatedContent[];
  recommendations?: string[];
  file_links?: FileLink[];
  tables?: Table[];
}

interface RelatedContent {
  image?: string;
  title: string;
  url: string;
}

interface FileLink {
  title: string;
  url: string;
}

interface Table {
  title: string;
  headers: string[];
  rows: string[][];
}

interface QuestionCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I am your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sendingRef = useRef(false);
  const [currentPage, setCurrentPage] = useState<'client' | 'chat'>('client');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dailyCount, setDailyCount] = useState<number>(0);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (currentPage === 'chat') {
      const scrollToBottom = () => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      };
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, currentPage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const todayKey = () => new Date().toISOString().slice(0,10);
  const loadDaily = useCallback(() => {
    try {
      const raw = localStorage.getItem('__dailyQ');
      const obj = raw ? JSON.parse(raw) as { date: string; count: number } : null;
      if (!obj || obj.date !== todayKey()) return { date: todayKey(), count: 0 };
      return obj;
    } catch { return { date: todayKey(), count: 0 }; }
  }, []);
  const saveDaily = (count: number) => {
    try { localStorage.setItem('__dailyQ', JSON.stringify({ date: todayKey(), count })); } catch {}
  };

  useEffect(() => {
    const init = loadDaily();
    setDailyCount(init.count);
  }, [loadDaily]);

  const questionCards: QuestionCard[] = [
    {
      icon: <User size={20} />,
      title: 'CEO',
      description: 'who is the CEO?',
      category: 'About'
    },
    {
      icon: <Building size={20} />,
      title: 'Offices',
      description: 'Where are our offices?',
      category: 'Location'
    },
    {
      icon: <Settings size={20} />,
      title: 'Services',
      description: 'What services do we provide?',
      category: 'Services'
    },
    {
      icon: <Briefcase size={20} />,
      title: 'Industries',
      description: 'What industries do we serve?',
      category: 'Industries'
    },
    {
      icon: <BarChart size={20} />,
      title: 'Stats',
      description: 'What are some impressive stats about Hutech?',
      category: 'Statistics'
    },
    {
      icon: <Trophy size={20} />,
      title: 'Certifications',
      description: 'What certifications do we have?',
      category: 'Qualifications'
    },
    {
      icon: <Laptop size={20} />,
      title: 'Tech Stack',
      description: 'What is our tech stack?',
      category: 'Technology'
    },
    {
      icon: <Phone size={20} />,
      title: 'Contact',
      description: 'Give me your contact details.',
      category: 'Contact'
    }
  ];
  // Helper function to validate and sanitize BotResponse data
  const validateBotResponse = (response: Partial<BotResponse>): BotResponse => {
    const isImageUrl = (u: string) => /^(data:image\/.+)|\.(png|jpe?g|gif|webp|svg|bmp|tiff?|heic|avif)(\?|#|$)/i.test(u || '');
    const normalizeUrl = (u: string) => {
      try {
        const url = new URL(u);
        url.hash = '';
        url.search = '';
        const path = url.pathname.replace(/\/+$/,'');
        const port = url.port ? `:${url.port}` : '';
        return `${url.protocol}//${url.hostname}${port}${path}`.toLowerCase();
      } catch {
        return (u || '').trim().toLowerCase().replace(/[?#].*$/,'').replace(/\/+$/,'');
      }
    };

    const cleanedRelated = Array.isArray(response.related_content)
      ? (() => {
          const seen = new Set<string>();
          const out: RelatedContent[] = [];
          for (const it of response.related_content as RelatedContent[]) {
            if (!it || typeof it.title !== 'string' || typeof it.url !== 'string') continue;
            const url = it.url.trim();
            if (!url) continue;
            if (isImageUrl(url)) continue; // exclude direct image links
            const key = normalizeUrl(url);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({ title: it.title, url, image: it.image });
          }
          return out;
        })()
      : undefined;

    return {
      answer: typeof response.answer === 'string' ? response.answer : '',
      related_content: cleanedRelated,
      recommendations: Array.isArray(response.recommendations)
        ? response.recommendations.filter(item => typeof item === 'string')
        : undefined,
      file_links: Array.isArray(response.file_links)
        ? response.file_links.filter(item =>
          item && typeof item.title === 'string' && typeof item.url === 'string'
        )
        : undefined,
      tables: Array.isArray(response.tables)
        ? response.tables.filter(table =>
          table &&
          typeof table.title === 'string' &&
          Array.isArray(table.headers) &&
          Array.isArray(table.rows)
        )
        : undefined
    };
  };

  // Helper function to parse JSON responses with multiple format support
  const parseJsonResponse = (jsonData: any): BotResponse => {
    // Handle different JSON response formats

    // Format 1: { response: { answer: "...", ... } }
    if (jsonData.response && typeof jsonData.response === 'object') {
      const rawResponse = {
        answer: jsonData.response.answer || jsonData.response.text || '',
        related_content: jsonData.response.related_content || jsonData.response.relatedContent,
        recommendations: jsonData.response.recommendations || jsonData.response.suggestions,
        file_links: jsonData.response.file_links || jsonData.response.fileLinks || jsonData.response.files,
        tables: jsonData.response.tables
      };
      return validateBotResponse(rawResponse);
    }

    // Format 2: { answer: "...", ... } (direct format)
    if (jsonData.answer || jsonData.text || jsonData.message) {
      const rawResponse = {
        answer: jsonData.answer || jsonData.text || jsonData.message,
        related_content: jsonData.related_content || jsonData.relatedContent,
        recommendations: jsonData.recommendations || jsonData.suggestions,
        file_links: jsonData.file_links || jsonData.fileLinks || jsonData.files,
        tables: jsonData.tables
      };
      return validateBotResponse(rawResponse);
    }

    // Format 3: { data: { ... } }
    if (jsonData.data && typeof jsonData.data === 'object') {
      return parseJsonResponse(jsonData.data);
    }

    // Format 4: Array format [{ answer: "..." }]
    if (Array.isArray(jsonData) && jsonData.length > 0) {
      return parseJsonResponse(jsonData[0]);
    }

    // Format 5: String response wrapped in object
    if (typeof jsonData === 'string') {
      return validateBotResponse({ answer: jsonData });
    }

    // Fallback: stringify the entire object
    return validateBotResponse({
      answer: JSON.stringify(jsonData, null, 2)
    });
  };

  // Helper function to parse text responses and detect if they contain JSON
  const parseTextResponse = (textData: string): BotResponse => {
    const trimmedText = textData.trim();

    // Check if the text might be JSON
    if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) ||
      (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmedText);
        return parseJsonResponse(parsed);
      } catch (e) {
        // If JSON parsing fails, treat as markdown/text
        console.warn('Text looks like JSON but failed to parse:', e);
      }
    }

    // Check for common structured text patterns and convert to proper format
    const processedText = preprocessTextResponse(trimmedText);

    return validateBotResponse({
      answer: processedText
    });
  };

  // Helper function to preprocess text responses for better rendering
  const preprocessTextResponse = (text: string): string => {

    // Handle common formatting patterns
    let processed = text;

    // Convert **bold** to proper markdown
    processed = processed.replace(/\*\*(.*?)\*\*/g, '**$1**');

    // Convert __bold__ to proper markdown
    processed = processed.replace(/__(.*?)__/g, '**$1**');

    // Convert *italic* to proper markdown
    processed = processed.replace(/\*(.*?)\*/g, '*$1*');

    // Fix line breaks and spacing
    processed = processed.replace(/\\n/g, '\n');
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    // Convert common bullet symbols to '-' at line start
    processed = processed.replace(/^\s*[•–]\s+/gm, '- ');
    // Ensure a blank line before any list (handles indented bullets and numbers)
    processed = processed.replace(/([^\n])\n(\s*[-*+]\s)/g, '$1\n\n$2');
    processed = processed.replace(/([^\n])\n(\s*\d+\.\s)/g, '$1\n\n$2');

    // Line-wise normalization to preserve horizontal rules (---) while fixing bullets
    const lines = processed.split(/\n/);
    const normalized = lines.map((line) => {
      const trimmed = line.trim();
      // Detect HR: three or more -, _, or * with only spaces between
      if (/^[-_*](\s*[-_*]){2,}$/.test(trimmed)) {
        return '---';
      }
      // Bullet like '-' or '*' or '+' with missing/extra spaces (but not HR)
      const bulletMatch = line.match(/^(\s*)[-*+]\s*(.+)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1];
        const content = bulletMatch[2];
        return `${indent}- ${content}`;
      }
      // Numbered list normalization
      const numMatch = line.match(/^(\s*)(\d+)\.\s*(.+)$/);
      if (numMatch) {
        const indent = numMatch[1];
        const num = numMatch[2];
        const content = numMatch[3];
        return `${indent}${num}. ${content}`;
      }
      return line;
    }).join('\n');

    processed = normalized;

    // Handle headers that might not have proper spacing
    processed = processed.replace(/^(#+)(\S)/gm, '$1 $2');

    // De-duplicate consecutive identical headings (e.g., repeated H1/H2 lines)
    const lines2 = processed.split('\n');
    const out: string[] = [];
    let lastHeadingText = '';
    for (const ln of lines2) {
      const m = ln.match(/^(#+)\s+(.*)$/);
      if (m) {
        const current = m[2].trim();
        if (current.toLowerCase() === lastHeadingText.toLowerCase()) {
          continue;
        }
        lastHeadingText = current;
        out.push(ln);
      } else {
        lastHeadingText = '';
        out.push(ln);
      }
    }
    processed = out.join('\n');

    return processed.trim();
  };

  const sendMessage = async (query?: string) => {
    const messageText = query || inputValue.trim();
    if (!messageText) return;
    if (sendingRef.current) return; // prevent multiple concurrent requests
    sendingRef.current = true;

    // Daily limit guard: max 10 per day
    const current = loadDaily();
    if (current.count >= 10) {
      // Inline contact form message instead of modal
      setCurrentPage('chat');
      const limitMsg: Message = {
        id: Date.now(),
        text: "Daily limit reached. Please share your details below and our HR will contact you.",
        isUser: false,
        timestamp: new Date(),
        contactForm: true
      };
      setMessages(prev => [...prev, limitMsg]);
      // Reset sending guard so user can interact further (e.g., fill the form)
      sendingRef.current = false;
      setIsLoading(false);
      return;
    }
    const newCount = current.count + 1;
    saveDaily(newCount);
    setDailyCount(newCount);

    // Switch to chat page immediately
    setCurrentPage('chat');

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    let attemptNotes: string[] | undefined;
    try {
      // Determine API endpoint; support multiple env var names and avoid localhost default in production
      const envCandidates = [
        process.env.REACT_APP_API_ENDPOINT,
        (process.env as any).REACT_APP_APIENDPOINT,
        (process.env as any).REACT_APP_APPENDPOINT,
        (process.env as any).REACT_APP_ENDPOINT
      ].map((s: any) => (s || '').toString().trim()).filter(Boolean);
      const host = window.location.hostname;
      const filteredEnv = envCandidates.filter((u) => {
        try {
          const x = new URL(u, window.location.href);
          if (host !== 'localhost' && /^(?:http|https):\/\/localhost(?::\d+)?\//i.test(x.href)) return false;
          return true;
        } catch { return false; }
      });
      const defaultCandidates = host === 'localhost'
        ? [
            // Same-origin routes (support CRA/Vite proxy)
            '/api/query', '/query', '/api/chat', '/chat', '/api/ask', '/ask',
            // Common localhost backends
            'http://localhost:3001/query', 'http://localhost:3001/api/query', 'http://localhost:3001/chat', 'http://localhost:3001/api/chat', 'http://localhost:3001/ask', 'http://localhost:3001/api/ask',
            'http://127.0.0.1:3001/query', 'http://127.0.0.1:3001/api/query',
            'http://localhost:5000/query', 'http://127.0.0.1:5000/query'
          ]
        : ['/api/query', '/query', '/api/chat', '/chat', '/api/ask', '/ask'];
      const candidates: string[] = (filteredEnv.length ? filteredEnv : defaultCandidates).filter(Boolean);

      let finalResponse: Response | null = null;
      let lastResponse: Response | null = null;
      attemptNotes = [] as string[];
      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: messageText }),
          });
          lastResponse = res;
          attemptNotes.push(`${url} -> ${res.status}`);
          if (res.ok) { finalResponse = res; break; }
          // If 404, try next candidate; otherwise keep last and break
          if (res.status !== 404) { break; }
        } catch (e: any) {
          attemptNotes.push(`${url} -> network error`);
          // Try next candidate on network errors
          continue;
        }
      }

      const response = finalResponse || lastResponse!;
      const contentType = response.headers.get('content-type') || '';
      let rawText = '';
      try {
        rawText = await response.clone().text();
      } catch (e1) {
        try {
          rawText = await response.text();
        } catch (e2) {
          console.warn('Response body read failed:', e1, e2);
          rawText = '';
        }
      }

      if (!response.ok) {
        const snippet = rawText?.slice(0, 300) || '';
        const reason = snippet ? `HTTP ${response.status}: ${snippet}` : `HTTP ${response.status}`;
        throw new Error(reason);
      }

      let botResponse: BotResponse;
      if (contentType.includes('application/json')) {
        try {
          const jsonData = JSON.parse(rawText);
          botResponse = parseJsonResponse(jsonData);
        } catch (e) {
          console.warn('JSON parse failed, using text renderer:', e);
          botResponse = parseTextResponse(rawText);
        }
      } else {
        botResponse = parseTextResponse(rawText);
      }

      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse.answer || "Sorry, I couldn't process your request.",
        isUser: false,
        timestamp: new Date(),
        response: botResponse,
        query: messageText // Store the user's question
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Provide helpful error message based on error type
      let errorText = "Sorry, I encountered an error while processing your request.";
      let debugInfo = '';
      let kind: ErrorKind = 'unknown_error';
      const isOffline = typeof navigator !== 'undefined' ? (navigator.onLine === false) : false;

      if (isOffline) {
        errorText = "You're offline. Please check your internet and try again.";
        debugInfo = 'Offline';
        kind = 'offline';
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorText = "Unable to reach the server. Please try again shortly.";
        debugInfo = 'Network connection failed';
        kind = 'network_failed';
      } else if (error instanceof SyntaxError) {
        errorText = "I received something I couldn't read. Please try again.";
        debugInfo = 'JSON parsing error';
        kind = 'json_parse_error';
      } else if (error instanceof Error) {
        const msg = error.message || '';
        if (/HTTP\s*404/i.test(msg)) {
          errorText = "I couldn't find the service. Please try again later. For more information you can contact us mobile +91 88674 87771 and email sales@hutechsolutions.com. We typically respond within one business day.";
          kind = 'http_404';
        } else if (/HTTP\s*5\d{2}/i.test(msg)) {
          errorText = "The service is having a moment. Please try again soon.";
          kind = 'http_5xx';
        } else {
          errorText = "Something went wrong. Please try again.";
          kind = 'unknown_error';
        }
        debugInfo = msg;
      }

      // Unified support message for backend errors (non-offline)
      if (kind !== 'offline') {
        errorText = "Sorry, I was unable to find what you were looking for. Please contact our team for your query at: Phone: +91 88674 87771 Email: sales@hutechsolutions.com . We will get back to you in 1 business day.";
      }

      // Log detailed error information for debugging
      console.warn('Chat error details:', {
        error: error,
        message: messageText,
        timestamp: new Date().toISOString(),
        debugInfo: debugInfo,
        attempts: (typeof attemptNotes !== 'undefined') ? attemptNotes : undefined
      });

      const errorMessage: Message = {
        id: Date.now() + 1,
        text: errorText,
        isUser: false,
        timestamp: new Date(),
        query: messageText,
        errorKind: kind
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      sendingRef.current = false;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading || sendingRef.current) return;
    setInputValue(suggestion);
    setTimeout(() => {
      sendMessage(suggestion);
    }, 100);
  };

  const handleCardClick = (card: QuestionCard) => {
    if (isLoading || sendingRef.current) return;
    sendMessage(card.description);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I am your AI assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date()
      }
    ]);
    setInputValue('');
    setCurrentPage('client');
    setShowMenu(false);
  };



  if (currentPage === 'client') {
    const showContact = (() => { try { return new URLSearchParams(window.location.search).has('contact') || new URLSearchParams(window.location.search).has('showContact'); } catch { return false; } })();
    return (
      <div className="client-page">


        {/* Main Content */}
        <main className="client-main">
          <div className="welcome-section">
            <h1 className="welcome-title">
              Your AI Partner, <span className="husqy-text">Husqy</span>
            </h1>
            <p className="welcome-subtitle">
              I'm here to help you explore Hutech Solutions' cutting-edge technology and IT services. Whether you're curious about our cutting-edge technology or need details on our IT services, feel free to ask.
            </p>
          </div>

          {/* Search Bar */}
          <div className="client-search-container">
            <form onSubmit={handleFormSubmit} className="client-search-form">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder=" Ask me anything..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                  className={`client-search-input${isLoading ? ' searching' : ''}`}
                />
                <button
                  type="submit"
                  className={`search-send-button${isLoading ? ' searching' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="searching-animation" aria-label="Loading">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>

          {showContact && (
            <div className="mt-6">
              <InlineContactForm />
            </div>
          )}

          {/* Question Cards - Horizontal Scroll */}
          <div className="question-cards-container">
            <div className="question-cards-scroll">
              {questionCards.map((card, index) => (
                <div
                  key={index}
                  className="question-card-horizontal"
                  onClick={() => handleCardClick(card)}
                >
                  <div className="card-icon">{card.icon}</div>
                  <div className="card-content">
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-description">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Chat Page
  return (
    <div className="bg-white body" id='body'>
      
      {/* Chat History Panel */}
      <div id="chat-history" className="chat-history-container">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isUser ? (
              <UserMessage text={message.text} />
            ) : (
              <BotMessage message={message} onSuggestionClick={handleSuggestionClick} />
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start justify-center">
            <div className="max-w-3xl w-full">
              <div className="px-4 py-2">
                <LoadingAnimation className="chat-loader-inline" direction="right" />
              </div>
            </div>
          </div>
        )}

      </div>


      {/* Chat Input Form with Menu */}
      <div className="sticky bottom-0 bg-white py-4 chat-input-sticky">
        <div className="chat-search-container">
          <form id="chat-form" className="chat-search-form" onSubmit={handleFormSubmit}>
            <div className="chat-input-wrapper" ref={menuRef}>
              <input
                id="user-input"
                type="text"
                placeholder=" Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className={`chat-search-input${isLoading ? ' searching' : ''}`}
              />

              {/* Clear chat (delete) button inside input */}
              <button
                type="button"
                className="chat-menu-button-inside chat-clear-button"
                onClick={clearChat}
                aria-label="Clear chat"
                title="Clear chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="w-5 h-5 chat-clear-icon"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              <button
                type="submit"
                className={`chat-send-button${isLoading ? ' searching' : ''}`}
                disabled={isLoading}
                title={dailyCount >= 10 ? 'Daily limit reached — click to open contact form' : undefined}
              >
                {isLoading ? (
                  <div className="searching-animation" aria-label="Loading">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>

              {showMenu && (
                <div className="chat-menu-dropdown">
                  <button
                    onClick={clearChat}
                    className="menu-item"
                  >
                    <div className="menu-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </div>
                    <span>Clear Chat</span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const UserMessage: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex justify-end">
      <div className="rounded-xl rounded-br-none p-4 shadow-md chat-bubble-user prose text-sm max-w-lg">
        <div dangerouslySetInnerHTML={{ __html: marked(text) as string }} />
      </div>
    </div>
  );
};

const MessageActions: React.FC<{
  message: Message;
}> = ({ message }) => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showActions = !message.errorKind;

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);


  const copyToClipboard = (text: string) => {
    return new Promise<void>((resolve, reject) => {
      // Try modern clipboard API first, but with proper error handling
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => resolve())
          .catch(() => {
            // If clipboard API fails, fall back to textarea method
            fallbackCopyTextToClipboard(text, resolve, reject);
          });
      } else {
        // Use fallback method directly
        fallbackCopyTextToClipboard(text, resolve, reject);
      }
    });
  };

  const fallbackCopyTextToClipboard = (text: string, resolve: () => void, reject: (err: any) => void) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;

    // Make the textarea out of viewport but still accessible
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');
    textArea.style.userSelect = 'text';

    document.body.appendChild(textArea);

    // Focus and select with better browser compatibility
    if (textArea.select) {
      textArea.focus();
      textArea.select();
    } else if (textArea.setSelectionRange) {
      textArea.focus();
      textArea.setSelectionRange(0, textArea.value.length);
    }

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        resolve();
      } else {
        // Final fallback: try selection API
        try {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(textArea);
          selection?.removeAllRanges();
          selection?.addRange(range);
          const copySuccess = document.execCommand('copy');
          selection?.removeAllRanges();

          if (copySuccess) {
            resolve();
          } else {
            reject(new Error('All copy methods failed'));
          }
        } catch (selectionError) {
          reject(new Error('Copy command and selection both failed'));
        }
      }
    } catch (err) {
      document.body.removeChild(textArea);
      reject(err);
    }
  };

  if (!showActions) return null;

  const buildPlainAnswer = (): string => {
    const htmlAnswer = safeRenderMarkdown(
      renderIcons(
        renderTables(message.text || '', message.response?.tables || [])
      )
    );
    let html = htmlAnswer
      .replace(/<\/(p|h[1-6]|li|tr|table|ul|ol)>/gi, '</$1>\n')
      .replace(/<br\s*\/?>/gi, '\n');
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = (tmp.textContent || '').replace(/\u00A0/g, ' ');
    return text.split('\n').map(l => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
  };

  const buildTablesPlain = (): string => {
    const tbls = message.response?.tables || [];
    if (!tbls.length) return '';

    const blocks: string[] = [];
    tbls.forEach(tbl => {
      const rows: string[][] = [];
      if (Array.isArray(tbl.headers) && tbl.headers.length) rows.push(tbl.headers.map(v => String(v ?? '')));
      (tbl.rows || []).forEach(r => rows.push(r.map(v => String(v ?? ''))));
      if (!rows.length) return;

      const cols = Math.max(...rows.map(r => r.length));
      const widths = Array.from({ length: cols }, (_, i) => Math.max(...rows.map(r => String(r[i] ?? '').length)));
      const format = (r: string[]) => r.map((c, i) => String(c ?? '').padEnd(widths[i] + 2, ' ')).join('').trimEnd();
      const lines = rows.map(format);
      blocks.push(lines.join('\n'));
    });

    return blocks.filter(Boolean).join('\n\n');
  };

  const handleCopy = () => {
    let textToCopy = '';
    if (message.query) textToCopy += `Question: ${message.query}\n\n`;

    // Build answer text without tables/images
    const htmlAnswer = safeRenderMarkdown(
      renderIcons(
        renderTables(message.text || '', message.response?.tables || [])
      )
    );
    let cleaned = htmlAnswer
      .replace(/<table[\s\S]*?<\/table>/gi, '')
      .replace(/<img[^>]*>/gi, '')
      .replace(/<br\s*\/?>(?=\S)/gi, '\n');
    const div = document.createElement('div');
    div.innerHTML = cleaned;
    const answerText = (div.textContent || '').replace(/\u00A0/g, ' ').split('\n').map(l => l.trimEnd()).join('\n').replace(/\n{3,}/g, '\n\n').trim();

    textToCopy += `Answer:\n${answerText}`;

    const tablesTxt = buildTablesPlain();
    if (tablesTxt) textToCopy += `\n\n${tablesTxt}`;

    copyToClipboard(textToCopy)
      .then(() => { alert('Content copied to clipboard!'); })
      .catch((err) => {
        console.error('Copy failed:', err);
        alert(`Copy failed due to browser restrictions. Please manually copy this content:\n\n${textToCopy}`);
      });
  };

  const buildShareText = () => {
    let text = '';
    if (message.query) text += `Question: ${message.query}\n\n`;
    text += `Answer:\n${buildPlainAnswer()}`;
    return text;
  };

  const openShareModal = () => setShowShareModal(true);
  const closeShareModal = () => setShowShareModal(false);

  const handleShareWhatsApp = () => {
    try {
      const shareText = buildShareText();
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(url, '_blank');
      closeShareModal();
    } catch (error) {
      console.error('WhatsApp share failed:', error);
      alert('Unable to open WhatsApp.');
    }
  };


  const handleShareFacebook = () => {
    try {
      const shareUrl = encodeURIComponent(window.location.href);
      const quote = encodeURIComponent(buildShareText());
      const url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${quote}`;
      window.open(url, '_blank');
      closeShareModal();
    } catch (error) {
      console.error('Facebook share failed:', error);
      alert('Unable to open Facebook.');
    }
  };

  const handleShareX = () => {
    try {
      const base = buildShareText();
      const text = encodeURIComponent(base.slice(0, 250));
      const intent = `https://twitter.com/intent/tweet?text=${text}`;
      window.open(intent, '_blank');
      closeShareModal();
    } catch (error) {
      console.error('X share failed:', error);
      alert('Unable to open X.');
    }
  };

  const handleShareEmail = () => {
    try {
      const subject = message.query || 'Shared Q&A from Husqy';
      const body = buildShareText();
      const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const a = document.createElement('a');
      a.href = mailto;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      closeShareModal();
    } catch (error) {
      console.error('Email share failed:', error);
      alert('Email share failed.');
    }
  };

  const ENABLE_PDF_EXPORT = true;
  const ENABLE_MD_EXPORT = false;

  const handleCopyLink = () => {
    const link = window.location.href;
    copyToClipboard(link)
      .then(() => alert('Link copied!'))
      .catch(() => alert(link));
  };

  const generatePDF = async () => {
    if (!ENABLE_PDF_EXPORT) { alert('PDF export is temporarily disabled.'); return; }
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const margin = 36;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const addHeading = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 24, 39);
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 20;
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
      };

      const addParagraph = (text: string) => {
        const sanitized = text.replace(/•\s?/g, '- ');
        const lines = doc.splitTextToSize(sanitized, contentWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 16;
        });
        y += 6;
      };

      const addSectionTitle = (text: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(31, 41, 55);
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 18;
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
      };

      const drawDivider = () => {
        if (y > pageHeight - margin - 20) { doc.addPage(); y = margin; }
        y += 10; // extra space before line
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 32; // extra space after line
      };

      const logoUrl = 'https://cdn.builder.io/api/v1/image/assets%2Fdc4265ec2f2449c79371971938c19898%2F496df066ecdc418c994b8726633ae9a3?format=png&width=800';
      try {
        const dataUrl = await fetchImageDataUrl(logoUrl);
        doc.addImage(dataUrl, 'PNG', margin, y, 140, 46);
        y += 75;
      } catch {}

      if (message.query) {
        addSectionTitle('Question');
        addParagraph(message.query);
        drawDivider();
        addSectionTitle('Answer');
      }

      const plain = buildPlainAnswer();
      plain.split(/\n\n+/).map(p => p.trim()).filter(Boolean).forEach(p => addParagraph(p));

      // Extract only images that appear in the answer content
      const answerHtml = safeRenderMarkdown(
        renderIcons(
          renderTables(message.text || '', message.response?.tables || [])
        )
      );
      const htmlImgs = Array.from(answerHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]);
      const mdImgs = Array.from((message.text || '').matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g)).map(m => m[1]);
      const imgSrcs = Array.from(new Set([...htmlImgs, ...mdImgs])).filter(Boolean);

      if (imgSrcs.length) {
        for (const src of imgSrcs) {
          try {
            const dataUrl = await fetchImageDataUrl(src);
            const { width, height } = await getImageNaturalSize(dataUrl);
            const scale = Math.min((contentWidth) / Math.max(1, width), 1);
            const w = Math.min(contentWidth, Math.round(width * scale));
            const h = Math.round(height * scale);
            if (y + h > pageHeight - margin) { doc.addPage(); y = margin; }
            doc.addImage(dataUrl, 'PNG', margin, y, w, h);
            y += h + 6;
          } catch {}
        }
      }

      const tables = message.response?.tables || [];
      const drawTable = (tbl: Table) => {
        if (tbl.title) addParagraph(tbl.title);
        const headers = (tbl.headers && tbl.headers.length) ? tbl.headers : Array(tbl.rows[0]?.length || 1).fill('');
        const rows = tbl.rows || [];
        const cols = headers.length;
        const colWidth = contentWidth / Math.max(1, cols);
        const baseRowHeight = 24;
        const lineH = 12; const vpad = 6;

        const drawRow = (cells: string[], isHeader: boolean) => {
          const heights = cells.map((c) => {
            const tl = doc.splitTextToSize(String(c ?? ''), colWidth - 8);
            return Math.max(baseRowHeight, tl.length * lineH + vpad * 2);
          });
          const rowHeight = Math.max(...heights);
          if (y + rowHeight > pageHeight - margin) { doc.addPage(); y = margin; }
          for (let c = 0; c < cols; c++) {
            const x = margin + c * colWidth;
            doc.rect(x, y, colWidth, rowHeight);
            const textLines = doc.splitTextToSize(String(cells[c] ?? ''), colWidth - 8);
            doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
            let ty = y + vpad + lineH;
            textLines.forEach((ln: string) => { doc.text(ln, x + 4, ty); ty += lineH; });
          }
          y += rowHeight;
        };

        drawRow(headers, true);
        rows.forEach(r => drawRow(r, false));
        y += 12;
      };
      tables.forEach(drawTable);

      const files = message.response?.file_links || [];
      if (files.length) { y += 16; addParagraph('Files'); files.forEach(f => addParagraph(`- ${f.title}: ${f.url}`)); }
      const pages = (message.response?.related_content || []).filter((p:any) => !p.image);
      if (pages.length) { y += 16; addParagraph('Related Pages'); pages.forEach((p:any) => addParagraph(`- ${p.title}: ${p.url}`)); }

      doc.save('hutech-response.pdf');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  const generateMarkdown = async () => {
    if (!ENABLE_MD_EXPORT) { alert('Markdown export is temporarily disabled.'); return; }
    try {
      const tablesToMarkdown = (tbl: Table): string => {
        const header = tbl.headers?.length ? `${tbl.headers.join(' | ')}\n${tbl.headers.map(() => '---').join(' | ')}` : '';
        const rows = tbl.rows.map(r => r.join(' | ')).join('\n');
        const body = [header, rows].filter(Boolean).join('\n');
        return body ? `\n\n${tbl.title ? `**${tbl.title}**\n` : ''}${body}\n` : '';
      };

      let answerMd = preprocessResponse(message.text || '').replace(/\[ICON:.*?\]/g, '');

      if (message.response?.tables && message.response.tables.length) {
        let replaced = false;
        message.response.tables.forEach(tbl => {
          const ph = `[TABLE:${tbl.title}]`;
          if (answerMd.includes(ph)) {
            answerMd = answerMd.replace(ph, tablesToMarkdown(tbl));
            replaced = true;
          }
        });
        if (!replaced) {
          answerMd += '\n' + message.response.tables.map(tablesToMarkdown).join('\n');
        }
      }

      let markdown = '';
      if (message.query) markdown += `# ${message.query}\n\n`;
      markdown += `${answerMd.trim()}\n`;

      if (message.response?.related_content?.length) {
        const imgs = message.response.related_content.filter(i => i.image);
        if (imgs.length) {
          markdown += `\n## Related Images\n\n`;
          imgs.forEach(i => { markdown += `![${i.title}](${i.image})\n\n`; });
        }
        const pages = message.response.related_content.filter(i => !i.image);
        if (pages.length) {
          markdown += `\n## Related Pages\n\n`;
          pages.forEach(p => { markdown += `- [${p.title}](${p.url})\n`; });
        }
      }

      if (message.response?.file_links?.length) {
        markdown += `\n## Files\n\n`;
        message.response.file_links.forEach(link => { markdown += `- [${link.title}](${link.url})\n`; });
      }

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hutech-response.md';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Markdown generation failed:', error);
      alert('Markdown export failed. Please try again.');
    }
  };

  const generateDOCX = async () => {
    try {
      const children: (Paragraph | DocxTable)[] = [];

      const logoUrl = 'https://cdn.builder.io/api/v1/image/assets%2Fdc4265ec2f2449c79371971938c19898%2F496df066ecdc418c994b8726633ae9a3?format=png&width=800';
      try {
        const bytes = await fetchImageBytes(logoUrl);
        children.push(new Paragraph({ children: [ new ImageRun({ data: bytes, transformation: { width: 360, height: 120 } } as any) ] }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 160 } }));
      } catch {}

      if (message.query) {
        children.push(new Paragraph({ text: message.query, heading: HeadingLevel.HEADING_1 }));
      }

      const plain = buildPlainAnswer();
      const paras = plain.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      paras.forEach(p => {
        children.push(new Paragraph({ children: [new TextRun({ text: p })], spacing: { after: 100 } }));
      });

      const imgItems = (message.response?.related_content || []).filter(i => i.image) as { image: string; title?: string }[];
      for (const it of imgItems) {
        try {
          const dataUrl = await fetchImageDataUrl(it.image);
          const { width, height } = await getImageNaturalSize(dataUrl);
          const maxWidth = 520;
          const scale = Math.min(maxWidth / Math.max(1, width), 1);
          const w = Math.round(width * scale);
          const h = Math.round(height * scale);
          const bytes = await fetchImageBytes(it.image);
          children.push(new Paragraph({ children: [ new ImageRun({ data: bytes, transformation: { width: w, height: h } } as any) ], spacing: { after: 120 } }));
        } catch {}
      }

      const tables = message.response?.tables || [];
      tables.forEach(tbl => {
        if (tbl.title) {
          children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: tbl.title, bold: true })] }));
        }
        const rows: TableRow[] = [];
        if (tbl.headers && tbl.headers.length) {
          rows.push(new TableRow({ children: tbl.headers.map(h => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] })) }));
        }
        tbl.rows.forEach(r => {
          rows.push(new TableRow({ children: r.map(c => new TableCell({ children: [new Paragraph(String(c))] })) }));
        });
        children.push(new DocxTable({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } }));
      });

      const files = message.response?.file_links || [];
      if (files.length) {
        children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Files', bold: true })] }));
        files.forEach(f => {
          children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: `${f.title}: ${f.url}` })] }));
        });
      }

      const pages = message.response?.related_content || [];
      if (pages.length) {
        children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Related Pages', bold: true })] }));
        pages.forEach(p => {
          children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: `${p.title}: ${p.url}` })] }));
        });
      }

      const doc = new DocxDocument({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hutech-response.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('DOCX generation failed:', error);
      alert('DOCX export failed. Please try again.');
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  return (
    <div className="message-actions flex items-center justify-between px-4 py-2">
      {/* Left side: Share and Export */}
      <div className="flex items-center gap-2">
        {/* Share Button opens modal */}
        <button
          onClick={openShareModal}
          className="action-button flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
          title="Share"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share
        </button>

        {/* Export Button - direct PDF */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              try {
                generatePDF();
              } catch (error) {
                console.error('PDF export error:', error);
                alert('PDF export failed. Please try again.');
              }
            }}
            className="action-button flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
            title="Export PDF"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Right side: Copy, Like, and Dislike */}
      <div className="flex items-center gap-2">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="action-button flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
          title="Copy content"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          Copy
        </button>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`action-button flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm ${isLiked ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          title="Like"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.398.83 1.169 1.398 2.02 1.398h.716c.83 0 1.598-.481 1.998-1.25a.739.739 0 00.109-.376c0-.621-.504-1.125-1.125-1.125H9.375c-.621 0-1.125.504-1.125 1.125v.375M5.904 18.75L7.5 16.5H5.904z" />
          </svg>
        </button>

        {/* Dislike Button */}
        <button
          onClick={handleDislike}
          className={`action-button flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors text-sm ${isDisliked ? 'text-red-600 bg-red-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          title="Dislike"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isDisliked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 rotate-180">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.398.83 1.169 1.398 2.02 1.398h.716c.83 0 1.598-.481 1.998-1.25a.739.739 0 00.109-.376c0-.621-.504-1.125-1.125-1.125H9.375c-.621 0-1.125.504-1.125 1.125v.375M5.904 18.75L7.5 16.5H5.904z" />
          </svg>
        </button>
        {/* Share Modal */}
        {showShareModal && (
          <div className="share-modal-overlay" role="dialog" aria-modal="true">
            <div className="share-card" role="document">
              <div className="share-card-header">
                <div className="share-card-title">Share</div>
                <button className="share-close" onClick={closeShareModal} aria-label="Close">×</button>
              </div>
              <div className="share-options">
                <button className="share-option" onClick={handleShareWhatsApp} title="WhatsApp">
                  <span className="share-icon whatsapp">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 2a10 10 0 00-8.94 14.5L2 22l5.62-1.5A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.12l-.29-.17-3.33.89.89-3.33-.17-.29A8 8 0 1112 20zm3.71-5.29c-.2-.1-1.17-.58-1.35-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.61.79-.11.14-.22.16-.42.06-.2-.1-.83-.31-1.58-.99-.58-.52-.97-1.16-1.09-1.36-.11-.2-.01-.31.08-.41.08-.08.2-.22.29-.33.09-.11.12-.19.18-.31.06-.12.03-.23-.01-.33-.04-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.34-.11-.01-.23-.01-.35-.01-.12 0-.33.05-.5.23-.17.18-.66.65-.66 1.58 0 .93.68 1.83.78 1.96.1.13 1.33 2.04 3.23 2.86.45.19.8.31 1.07.4.45.14.86.12 1.19.07.36-.05 1.17-.48 1.33-.94.16-.46.16-.85.11-.94-.05-.09-.18-.14-.38-.24z" /></svg>
                  </span>
                  <span className="share-label">WhatsApp</span>
                </button>

                <button className="share-option" onClick={handleShareFacebook} title="Facebook">
                  <span className="share-icon facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M22 12a10 10 0 10-11.5 9.95v-7.04H7.9V12h2.6V9.8c0-2.57 1.53-3.99 3.87-3.99 1.12 0 2.29.2 2.29.2v2.52h-1.29c-1.27 0-1.66.79-1.66 1.6V12h2.83l-.45 2.91h-2.38v7.04A10 10 0 0022 12z" /></svg>
                  </span>
                  <span className="share-label">Facebook</span>
                </button>

                <button className="share-option" onClick={handleShareX} title="X">
                  <span className="share-icon x">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M17.53 2H20l-5.5 6.3L21 22h-6.4l-3.9-6.1L5.9 22H3.4l6-6.9L3 2h6.5l3.5 5.6L17.5 2h.03zM8.2 3.7h-1l8.8 14h1L8.2 3.7z" /></svg>
                  </span>
                  <span className="share-label">X</span>
                </button>

                <button className="share-option" onClick={handleShareEmail} title="Email">
                  <span className="share-icon email">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                  </span>
                  <span className="share-label">Email</span>
                </button>


              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BotMessage: React.FC<{
  message: Message;
  onSuggestionClick: (suggestion: string) => void;
}> = ({ message, onSuggestionClick }) => {
  const response = message.response;
  const answerRef = useRef<HTMLDivElement>(null);
  const [hasInlineImage, setHasInlineImage] = useState(false);
  const answerImages = useMemo(() => {
    const html = safeRenderMarkdown(
      renderIcons(
        renderTables(message.text || '', response?.tables || [])
      )
    );
    const htmlImgs = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map(m => m[1]);
    const mdImgs = Array.from((message.text || '').matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)/g)).map(m => m[1]);
    const all = Array.from(new Set([...htmlImgs, ...mdImgs])).filter(Boolean);
    setHasInlineImage(all.length > 0);
    return all;
  }, [message.text, response?.tables]);

  useEffect(() => {
    const root = answerRef.current;
    if (!root) return;
    const fallback = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="24" viewBox="0 0 64 24"><rect width="64" height="24" fill="%23f3f4f6"/><text x="8" y="16" font-size="12" fill="%236b7280">Image</text></svg>';
    const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[];
    imgs.forEach((img) => {
      const prev = img.onerror;
      img.onerror = () => {
        if (img.src !== fallback) img.src = fallback;
        if (typeof prev === 'function') try { prev(new Event('error')); } catch { }
      };
    });
  }, [message.text]);


  return (
    <div className="flex items-start justify-center">
      <div className="max-w-3xl w-full">

        {/* Related Content Card Carousel */}
        {response?.related_content && response.related_content.length > 0 && (
          <RelatedContentCarousel items={response.related_content} />
        )}

        {/* Inline Contact Form for limit reached */}
        {message.contactForm && (
          <InlineContactForm />
        )}

        {/* Main Answer with inline GIF when applicable */}
        {message.text && !message.contactForm && (() => {
          const fullHtml = safeRenderMarkdown(
            renderIcons(
              renderTables(message.text, response?.tables || [])
            )
          );
          const firstMatch = /<img[^>]*>/i.exec(fullHtml);
          const beforeHtml = firstMatch ? fullHtml.slice(0, firstMatch.index || 0) : fullHtml;
          const afterHtml = firstMatch ? fullHtml.slice(firstMatch.index || 0).replace(/<img[^>]*>/gi, '') : null;
          return (
            <div className="p-4 rounded-xl prose text-gray-800">
              <div ref={answerRef} className="answer-html" dangerouslySetInnerHTML={{ __html: beforeHtml }} />
              {answerImages.length > 0 && !message.errorKind && (
                <AnswerImagesCarousel images={answerImages} />
              )}
              {afterHtml !== null && (
                <div className="answer-html" dangerouslySetInnerHTML={{ __html: afterHtml }} />
              )}
              {/* Error GIF based on error kind */}
              {message.errorKind && (
                <div className="px-4 mb-4 answer-gif-wrapper">
                  <img
                    src={ERROR_GIFS[message.errorKind] || ERROR_GIFS.unknown_error}
                    alt={message.errorKind.replace(/_/g, ' ')}
                    className="answer-gif rounded-lg"
                    onError={(e) => {
                      const fallback = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
                      const el = e.currentTarget as HTMLImageElement;
                      if (el.src !== fallback) el.src = fallback;
                    }}
                  />
                </div>
              )}
              {/* Context GIF only when not an error */}
              {message.id !== 1 && !message.errorKind && (
                <AnswerGifSmart
                  query={message.query}
                  answer={message.text}
                  related={response?.related_content}
                  hasInlineImage={hasInlineImage}
                />
              )}
            </div>
          );
        })()}

        {/* Action Buttons - Hide for welcome message */}
        {message.text && !message.contactForm && message.id !== 1 && !message.errorKind && (
          <MessageActions message={message} />
        )}

        {/* File Links */}
        {response?.file_links && response.file_links.length > 0 && (
          <FileLinksSection files={response.file_links} />
        )}

        {/* Suggested Questions */}
        {response?.recommendations && response.recommendations.length > 0 && (
          <SuggestionsSection
            suggestions={response.recommendations}
            onSuggestionClick={onSuggestionClick}
          />
        )}
      </div>
    </div>
  );
};

// Inline contact form component used when daily limit is reached
const InlineContactForm: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Temporarily disable chat input while the contact form is visible to prevent unintended focus switches
  useEffect(() => {
    const chatInput = document.getElementById('user-input') as HTMLInputElement | null;
    const chatSend = document.querySelector('.chat-send-button') as HTMLButtonElement | null;
    const clientSearch = document.querySelector('.client-search-input') as HTMLInputElement | null;
    const prevDisabledInput = chatInput?.disabled ?? undefined;
    const prevDisabledBtn = chatSend?.disabled ?? undefined;
    const prevDisabledClient = clientSearch?.disabled ?? undefined;
    if (chatInput) chatInput.disabled = true;
    if (chatSend) chatSend.disabled = true;
    if (clientSearch) clientSearch.disabled = true;
    return () => {
      if (chatInput && prevDisabledInput !== undefined) chatInput.disabled = prevDisabledInput;
      if (chatSend && prevDisabledBtn !== undefined) chatSend.disabled = prevDisabledBtn;
      if (clientSearch && prevDisabledClient !== undefined) clientSearch.disabled = prevDisabledClient;
    };
  }, []);

  const makeText = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#c0c4cc'; ctx.lineWidth = 1;
    for (let y = 5; y < H; y += 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let i = 0; i < 15; i++) { ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.12})`; ctx.fillRect(Math.random()*W, Math.random()*H, 2, 2); }
    const xStart = 10; const gap = 24;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const angle = (Math.random() - 0.5) * 0.45;
      ctx.save();
      ctx.translate(xStart + i * gap, H/2 + 6);
      ctx.rotate(angle);
      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = '#1f4ea3';
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
    ctx.strokeStyle = '#d11'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(4, 6 + Math.random()*8); ctx.lineTo(W-4, H-6 - Math.random()*8); ctx.stroke();
  };

  const genCaptcha = useCallback(() => {
    const t = makeText();
    setCaptchaText(t);
    setCaptchaInput('');
    setTimeout(() => drawCaptcha(t), 0);
  }, []);
  useEffect(() => { genCaptcha(); }, [genCaptcha]);

  const [hookUrl] = useState<string>(() => resolveWebhook());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) { setError('Please fill required fields.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Enter a valid email.'); return; }
    if (captchaInput.trim().toLowerCase() !== captchaText.toLowerCase()) { setError('Captcha answer is incorrect.'); return; }
    setSubmitting(true);
    try {
      const payload = { subject: 'contact forms Husqy', name: form.name, email: form.email, mobile: form.phone, company: form.company, message: form.message };
      const hook = (hookUrl || resolveWebhook()).trim();
      const candidates = [hook, '/api/contact', '/contact', '/api/form', '/form', '/api/lead', '/lead'].filter(Boolean);
      let delivered = false;
      let lastError: any = null;
      for (const endpoint of candidates) {
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (res.ok) { delivered = true; break; }
          lastError = new Error(`HTTP ${res.status}`);
        } catch (e) { lastError = e; }
      }
      if (!delivered) {
        const subject = encodeURIComponent('New contact from Husqy chat');
        const body = encodeURIComponent(
          `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nCompany: ${form.company}\nMessage: ${form.message}`
        );
        const mailto = `mailto:sales@hutechsolutions.com?subject=${subject}&body=${body}`;
        const a = document.createElement('a');
        a.href = mailto; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setSuccess(true);
        setForm({ name: '', email: '', phone: '', company: '', message: '' });
        genCaptcha();
        setCaptchaInput('');
        return;
      }
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
      genCaptcha();
      setCaptchaInput('');
    } catch (err) {
      setError('Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const Field: React.FC<{
    id: string; type?: string; label: string; value: string; onChange: (v: string) => void; icon: React.ReactNode; autoComplete?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  }> = ({ id, type = 'text', label, value, onChange, icon, autoComplete, required, inputMode }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.currentTarget.value);
    };
    return (
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={(e) => {
            const next = e.relatedTarget as HTMLElement | null;
            // If focus moved to nowhere or a non-input element, restore focus to allow continuous typing
            if (!next || (next.tagName !== 'INPUT' && next.tagName !== 'TEXTAREA')) {
              try { inputRef.current?.focus({ preventScroll: true } as any); } catch { inputRef.current?.focus(); }
            }
          }}
          autoComplete={autoComplete}
          required={required}
          inputMode={inputMode}
          className="peer w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-3 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder=" "
        />
        <label htmlFor={id} className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-gray-400 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-placeholder-shown:-translate-y-1/2 peer-focus:translate-y-0 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600 peer-[:not(:placeholder-shown)]:translate-y-0">
          {label}
        </label>
      </div>
    );
  };

  return (
    <div className="px-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 shadow-xl">
        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">Thanks! Your details were sent to HR. We will contact you soon.</div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Contact us</h3>
                <p className="text-sm text-gray-500">We typically respond within one business day.</p>
              </div>
              <div className="hidden text-sm text-gray-500 sm:block">
                <div className="flex items-center gap-4">
                  <a href="mailto:sales@hutechsolutions.com" className="hover:text-gray-700">sales@hutechsolutions.com</a>
                  <span className="text-gray-300">|</span>
                  <span>8867487771</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field id="name" label="Full name*" value={form.name} onChange={(v) => setForm({ ...form, name: v })} icon={<User className="h-4 w-4" />} autoComplete="name" required />
              <Field id="email" type="email" label="Email*" value={form.email} onChange={(v) => setForm({ ...form, email: v })} icon={<Mail className="h-4 w-4" />} autoComplete="email" required />
              <Field id="company" label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} icon={<Building className="h-4 w-4" />} autoComplete="organization" />
              <Field id="phone" type="tel" label="Phone*" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} icon={<Phone className="h-4 w-4" />} autoComplete="tel" required inputMode="tel" />
            </div>

            <div className="relative">
              <textarea
        id="message"
        name="message"
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="peer w-full rounded-xl border border-gray-200 bg-white p-3 pt-5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder=" "
      />
              <label htmlFor="message" className="pointer-events-none absolute left-3 top-3 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:top-3 peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-gray-600">Message</label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={genCaptcha} aria-label="Refresh captcha" className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-800">
                <RefreshCw className="h-5 w-5" />
              </button>
              <canvas ref={canvasRef} width={160} height={44} className="rounded-md border border-gray-200" />
              <input
                className="w-40 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter code"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
              />
            </div>

            {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400"
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


const RelatedContentCarousel: React.FC<{ items: RelatedContent[] }> = ({ items }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);


  // Function to get favicon URL for a website
  const getFaviconUrl = (websiteUrl: string): string => {
    try {
      const urlObj = new URL(websiteUrl);
      const domain = urlObj.hostname;
      // Use Google's favicon service for reliable favicon fetching
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return '';
    }
  };

  const scrollLeft = () => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      const scrollAmount = 200;
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial check
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="w-full mb-6">
      <h5 className="font-semibold text-gray-800 mb-2 px-4">Related content</h5>
      <div className="related-content-carousel-wrapper">
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`carousel-nav-button carousel-nav-left ${!canScrollLeft ? 'disabled' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div
          ref={containerRef}
          className="related-content-horizontal-container"
        >
          {items.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="related-content-mini-card"
            >
              <div className="mini-card-favicon">
                <img
                  src={getFaviconUrl(item.url)}
                  alt={`${new URL(item.url).hostname} favicon`}
                  className="favicon-image"
                  onError={(e) => {
                    // Replace with fallback icon if favicon fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="favicon-fallback" style={{ display: 'none' }}>
                  ����
                </div>
              </div>
              <div className="mini-card-content">
                <div className="mini-card-hostname">
                  {new URL(item.url).hostname.replace('www.', '')}
                </div>
                <div className="mini-card-title">{item.title}</div>
              </div>
            </a>
          ))}
        </div>

        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`carousel-nav-button carousel-nav-right ${!canScrollRight ? 'disabled' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const AnswerImagesCarousel: React.FC<{ images: string[] }> = ({ images }) => {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [validImages, setValidImages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload and keep only valid image URLs
  useEffect(() => {
    let isMounted = true;
    const uniq = Array.from(new Set(images)).filter(Boolean);
    const preload = (src: string) => new Promise<boolean>((resolve) => { const im = new Image(); im.onload = () => resolve(true); im.onerror = () => resolve(false); im.src = src; });
    (async () => {
      const pairs = await Promise.all(uniq.map(async (u) => [(await preload(u)), u] as const));
      const ok = pairs.filter(p => p[0]).map(p => p[1]);
      if (isMounted) setValidImages(ok);
    })();
    return () => { isMounted = false; };
  }, [images]);

  const onScroll = () => {
    const el = containerRef.current; if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    el.addEventListener('scroll', onScroll); onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [validImages.length]);

  const scrollBy = (dx: number) => containerRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  // If none are valid, render nothing (avoid blank cards)
  if (!validImages.length) return null;

  return (
    <div className="answer-image-carousel-wrapper">
      <button onClick={() => scrollBy(-240)} disabled={!canScrollLeft} className={`carousel-nav-button carousel-nav-left ${!canScrollLeft ? 'disabled' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
      </button>
      <div ref={containerRef} className="answer-images-horizontal">
        {validImages.map((src, i) => (
          <div key={`${src}-${i}`} className="answer-image-card">
            <img
              src={src}
              alt={`image ${i+1}`}
              className="answer-image"
              onError={() => setValidImages(prev => prev.filter(s => s !== src))}
            />
          </div>
        ))}
      </div>
      <button onClick={() => scrollBy(240)} disabled={!canScrollRight} className={`carousel-nav-button carousel-nav-right ${!canScrollRight ? 'disabled' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
      </button>
    </div>
  );
};


const AnswerGifSmart: React.FC<{ query?: string; answer?: string; related?: RelatedContent[]; hasInlineImage?: boolean }> = ({ query, answer, related, hasInlineImage }) => {
  const [gif, setGif] = useState<{ url: string; link?: string; title?: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (hasInlineImage) { setGif(null); return () => { cancelled = true; }; }

    const base = (query && query.trim()) || (answer || '').slice(0, 200);
    const text = `${base} ${(related || []).map(r => `${r.title} ${r.url}`).join(' ')}`.toLowerCase();
    const intentText = (query || '').toLowerCase();

    const isLocation = /(\boffice|offices|location|address|headquarters|\bhq\b|branch|where|map|directions|route|campus|city|country|state|bengaluru|bangalore|delhi|mumbai|london|new york)/i.test(intentText || text);
    const isSuccess = /(success|successful|booked|booking|confirmed|confirmation|done|completed|achieved|congrats|congratulations|win|victory|approved)/i.test(intentText || text);
    const isServices = /(service|services|ai|artificial intelligence|machine learning|ml|devops|cloud|kubernetes|sre|hr|human resources|recruit|hiring|staffing|consulting|ecommerce|analytics|data|software|app|development|website|web|mobile|it|security|network|industry|industries|sector|sectors|domain|domains)/i.test(intentText || text);

    type Cat = 'location' | 'services' | 'success' | 'general';
    const category: Cat = isSuccess ? 'success' : isLocation ? 'location' : isServices ? 'services' : 'general';


    const banned = ['person','man','woman','men','women','girl','boy','kid','baby','face','selfie','actor','actress','celebrity','human','crowd','kiss','dance','dancing','hug','wedding','party','football','cricket','basketball','reaction','meme','fail','when you','me:','her:','him:','zombie','brain','cat','dog','glitch','distort','distortion','noisy','noise','static','grain','datamosh','matrix','error','404','bug','broken','corrupt','corrupted','scanline','hacker','hack','leak','malware','virus','bloody','gore','nsfw','explicit','nudity','nude','sexy','thirst','twerk','prank','heart','love','valentine','cute','kawaii','anime','manga','sakura','cherry blossom','festival','logo','watermark','brand','branding','sponsor','sponsored','copyright','trademark','tm'];
    const irrelevant = ['meme','reaction','fail','wtf','omg','lol','lmao','vine'];
    const noisyOrCasual = ['song','lyrics','music','audio','tiktok','reel','shorts','cartoon','character','emoji','sticker','funny','yeah','oh yeah','yolo','prank','comic','subtitle','subtitles','caption','typography','letters','font','word','title','install','subscribe','welcome','click','download','promo','advert','ad','commercial','intro','fun','kaleidoscope','trippy','psychedelic','glitter','neon','pattern','texture'];

    const isBanned = (s?: string) => {
      const t = (s || '').toLowerCase();
      return banned.some(k => t.includes(k));
    };
    const looksIrrelevant = (s?: string) => {
      const t = (s || '').toLowerCase();
      return irrelevant.some(k => t.includes(k));
    };

    const hasBranding = (s?: string) => {
      const raw = s || '';
      const t = raw.toLowerCase();
      if (!t) return false;
      if (/(logo|watermark|brand|branding|sponsor|sponsored|copyright|trademark|tm)/.test(t)) return true;
      try {
        const u = new URL(raw);
        const host = (u.hostname || '').toLowerCase();
        if (host.includes('giphy.com') || host.includes('tenor.com')) return false;
        return true; // any other external domain implies branding
      } catch {
        // Not a valid URL string; fall back to regex but ignore giphy/tenor mentions
        if (/\b(?!(?:giphy|tenor)\.)[a-z0-9-]+\.(com|net|org|io|ai|co|in)\b/.test(t)) return true;
      }
      return false;
    };

    const catTokens: Record<Cat, string[]> = {
      location: ['map','globe','world map','location pin','marker','office building','city skyline','navigation','route','airplane','plane','airport','suitcase','teamwork','handshake','meeting'],
      services: ['technology','circuit','code','server','cloud','pipeline','robot arm','ai chip','data','dashboard','network','laptop','shield','monitor'],
      success: ['celebration','confetti','fireworks','checkmark','success badge','trophy','ribbon','party popper'],
      general: ['business','technology','network','process','workflow','collaboration','globe','corporate','office building']
    };


    const extractSubject = (t: string): Cat | 'payroll' | 'leave' | 'office' | 'hr' | 'meeting' | 'project' | 'engagement' | 'communication' | 'industries' | 'contact' | 'about' => {
      const s = t.toLowerCase();
      if (/(payroll|salary|salaries|compensation|payslip|pay slip|payment|invoice)/.test(s)) return 'payroll';
      if (/(leave|vacation|holiday|pto|time off)/.test(s)) return 'leave';
      if (/(office|location|address|headquarters|hq|branch|map|route|pin|directions)/.test(s)) return 'office';
      if (/(^|\b)(hr|human resources)\b|policy|help|support/.test(s)) return 'hr';
      if (/(meeting|calendar|schedule|appointment|call|conference|consult|consultation)/.test(s)) return 'meeting';
      if (/(contact|phone|email|reach|connect|get in touch|call us)/.test(s)) return 'contact';
      // CEO / leadership queries
      if (/(^|\b)(ceo|founder|chairman|managing director|md|executive|leadership|leader|chief executive)\b/.test(s)) return 'about';
      if (/(industry|industries|sector|sectors|domain|domains)/.test(s)) return 'industries';
      if (/(project|delivery|deadline|milestone|release|deployment)/.test(s)) return 'project';
      if (/(engagement|culture|team building|morale|recognition)/.test(s)) return 'engagement';
      if (/(communicat|message|email|chat|collaborat)/.test(s)) return 'communication';
      if (isServices) return 'services';
      if (isLocation) return 'location';
      if (isSuccess) return 'success';
      return 'general';
    };

    const subject = extractSubject(intentText || text);


    const scoreMeta = (meta: string, url: string, cat: Cat) => {
      let score = 0;
      if (!url) score -= 10;
      if (isBanned(meta) || isBanned(url) || looksIrrelevant(meta)) score -= 100;
      if (/(glitch|distort|noise|static|grain|datamosh|matrix|error|404|bug|broken|corrupt|scanline|hacker|hack|leak)/.test(meta)) score -= 80;
      if (noisyOrCasual.some(k => meta.includes(k))) score -= 60;
      catTokens[cat].forEach(k => { if (meta.includes(k)) score += 3; });
      if (/(professional|clean|minimal|icon|illustration|diagram|flat|outline|line|animation|loop)/.test(meta)) score += 8;
      if (/(abstract|pattern|texture|kaleidoscope|psychedelic|trippy|glitter|neon)/.test(meta)) score -= 35;
      if (/(text|caption|meme|quote|typography|letters|word|title|font)/.test(meta)) score -= 40;
      return score;
    };

    const tenorkey = process.env.REACT_APP_TENOR_KEY;
    const giphykey = process.env.REACT_APP_GIPHY_KEY;

    const requiredBySubject: Record<string, string[]> = {
      office: ['map','pin','location','office','building','globe','world map','marker','route','city'],
      leave: ['calendar','date','schedule'],
      payroll: ['money','payment','invoice','rupee','dollar','coin','transaction'],
      hr: ['handshake','support','help','hr'],
      meeting: ['meeting','handshake','discussion','consult','consultation','calendar','video','call','conference','schedule'],
      project: ['checklist','progress','rocket','delivery','task','milestone'],
      engagement: ['team','teamwork','collaboration'],
      communication: ['communication','chat','message','email','support'],
      industries: ['industry','factory','gear','cog','cogs','sectors','sector','icons','grid'],
      contact: ['phone','call','email','mail','envelope','support','headset','contact'],
      services: ['technology','server','cloud','devops','ai','code','network','laptop'],
      success: ['success','checkmark','trophy','confetti','celebration','badge'],
      general: ['business','technology','network','process','workflow','collaboration','globe','office','corporate'],
      about: ['company','office','team','leadership','corporate','organization','ceo','founder','executive','chief']
    };
    const matchesRequired = (meta: string, subj: string) => {
      const req = requiredBySubject[subj] || [];
      if (!req.length) return true;
      return req.some(k => meta.includes(k));
    };

    const MIN_SCORE = 10;

    const wantsCharts = /(analytics|statistic|statistics|chart|graph|dashboard|metrics|kpi|report|reporting|data visualization|visualization)/.test((intentText || text));
    const hasCharts = (s?: string) => /\b(graph|chart|plot|scatter|bar|line chart|pie chart|histogram|axis|3d|mesh|surface|contour)\b/i.test(s || '');

    const getHistory = (): string[] => {
      const w = window as any;
      if (!Array.isArray(w.__gifHistory)) w.__gifHistory = [] as string[];
      return w.__gifHistory as string[];
    };
    const pushHistory = (u: string) => {
      const h = getHistory();
      h.push(u);
      if (h.length > 12) h.splice(0, h.length - 12);
    };

    const tryTenor = async (q: string): Promise<{url?: string; link?: string; title?: string} | null> => {
      if (!tenorkey) return null;
      try {
        const r = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${tenorkey}&limit=50&contentfilter=high&media_filter=gif,tinygif`);
        const j = await r.json();
        const items = Array.isArray(j?.results) ? j.results : [];
        const ranked = items.map((it: any) => {
          const url = it?.media_formats?.gif?.url || it?.media_formats?.tinygif?.url || '';
          const meta = `${(it?.content_description||'')} ${(it?.h1_title||'')} ${((it?.tags||[]).join(' ')||'')} ${(it?.itemurl||'')}`.toLowerCase();
          const score = scoreMeta(meta, url, category);
          return { url, link: it?.itemurl as string | undefined, title: it?.content_description || it?.h1_title || 'gif', score, meta };
        })
        .filter((x: any) => x.url && /\.gif(\?|$)/i.test(x.url) && x.score >= MIN_SCORE && matchesRequired(x.meta, subject as string) && !hasBranding(x.meta) && !hasBranding(x.link || '') && (wantsCharts || !hasCharts(x.meta)))
        .sort((a: any,b: any) => b.score - a.score);
        const history = getHistory();
        const pool = ranked.filter((r: any) => !history.includes(r.url));
        const list = pool.length ? pool : ranked;
        const top = list.slice(0, Math.min(8, list.length));
        const idx = Math.floor(Math.pow(Math.random(), 1.7) * top.length);
        const pick = top[idx] || list[0];
        if (pick) pushHistory(pick.url);
        return pick || null;
      } catch { return null; }
    };

    const tryGiphy = async (q: string): Promise<{url?: string; link?: string; title?: string} | null> => {
      if (!giphykey) return null;
      try {
        const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${giphykey}&q=${encodeURIComponent(q)}&limit=50&rating=g&lang=en`);
        const j = await r.json();
        const items = Array.isArray(j?.data) ? j.data : [];
        const ranked = items.map((it: any) => {
          const url = it?.images?.downsized?.url || it?.images?.original?.url || '';
          const meta = `${it?.title||''} ${it?.slug||''} ${it?.url||''}`.toLowerCase();
          const score = scoreMeta(meta, url, category);
          return { url, link: it?.url as string | undefined, title: it?.title || 'gif', score, meta };
        })
        .filter((x: any) => x.url && /\.gif(\?|$)/i.test(x.url) && x.score >= MIN_SCORE && matchesRequired(x.meta, subject as string) && !hasBranding(x.meta) && !hasBranding(x.link || '') && (wantsCharts || !hasCharts(x.meta)))
        .sort((a: any,b: any) => b.score - a.score);
        const history = getHistory();
        const pool = ranked.filter((r: any) => !history.includes(r.url));
        const list = pool.length ? pool : ranked;
        const top = list.slice(0, Math.min(8, list.length));
        const idx = Math.floor(Math.pow(Math.random(), 1.7) * top.length);
        const pick = top[idx] || list[0];
        if (pick) pushHistory(pick.url);
        return pick || null;
      } catch { return null; }
    };

    const searchBoth = async (queries: string[]) => {
      const seen = new Set<string>();
      for (const raw of queries) {
        const q = raw.trim();
        if (!q || seen.has(q)) continue; seen.add(q);
        const t1 = await tryTenor(q);
        if (!cancelled && t1?.url) { setGif({ url: t1.url!, link: t1.link, title: t1.title }); return true; }
        const g1 = await tryGiphy(q);
        if (!cancelled && g1?.url) { setGif({ url: g1.url!, link: g1.link, title: g1.title }); return true; }
      }
      return false;
    };

    // Track which keywords we have already used to pick GIFs so we rotate words too
    const getKwHistory = (): string[] => {
      const w = window as any;
      if (!Array.isArray(w.__gifKwHistory)) w.__gifKwHistory = [] as string[];
      return w.__gifKwHistory as string[];
    };
    const pushKwHistory = (kw: string) => {
      const h = getKwHistory();
      if (!h.includes(kw)) h.push(kw);
      if (h.length > 40) h.splice(0, h.length - 40);
    };

    // Try a single keyword and record history on success
    const tryKeyword = async (kw: string) => {
      const q = kw.trim(); if (!q) return false;
      const t1 = await tryTenor(q);
      if (!cancelled && t1?.url) { setGif({ url: t1.url!, link: t1.link, title: t1.title }); pushKwHistory(kw); return true; }
      const g1 = await tryGiphy(q);
      if (!cancelled && g1?.url) { setGif({ url: g1.url!, link: g1.link, title: g1.title }); pushKwHistory(kw); return true; }
      return false;
    };

    // Extract significant keywords from the answer text
    const extractKeywords = (t: string): string[] => {
      const s = (t || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
      const stop = new Set(['the','and','for','with','that','this','from','your','you','our','are','about','have','into','over','such','their','them','they','will','can','any','than','then','there','here','what','why','who','how','when','where','within','one','two','three','more','most','less','least','a','an','of','in','on','to','by','at','as','is','it','be','or','we','us','me','my','mine','I','was','were','been','being','do','does','did']);
      const counts: Record<string, number> = {};
      s.split(/\s+/).forEach(w => {
        if (!w || w.length < 3) return;
        if (stop.has(w)) return;
        counts[w] = (counts[w] || 0) + 1;
      });
      const words = Object.keys(counts).sort((a,b) => (counts[b]-counts[a]) || (b.length - a.length));
      return words.slice(0, 15);
    };



    const parseEnvOverrides = (): GifOverridesMap => {
      try {
        const raw = process.env.REACT_APP_GIF_OVERRIDES;
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        const out: GifOverridesMap = {} as GifOverridesMap;
        Object.entries(parsed || {}).forEach(([k, v]) => {
          const arr = Array.isArray(v) ? v : [v];
          out[k.toLowerCase()] = arr
            .map((it: any) => ({
              url: it.url ? String(it.url) : undefined,
              query: it.query ? String(it.query) : undefined,
              link: it.link ? String(it.link) : undefined,
              title: it.title ? String(it.title) : undefined
            }))
            .filter((it: GifOverride) => !!(it.url || it.query));
        });
        return out;
      } catch { return {}; }
    };

    const allOverrides: GifOverridesMap = {
      ...(Object.create(null) as GifOverridesMap),
      ...Object.fromEntries(Object.entries(gifOverrides || {}).map(([k, v]) => [k.toLowerCase(), v])),
      ...parseEnvOverrides()
    };

    const findOverrideKey = (t: string): { key: string; list: GifOverride[] } | null => {
      const s = (t || '').toLowerCase();
      const entries = Object.entries(allOverrides).sort((a, b) => b[0].length - a[0].length);
      for (const [kw, list] of entries) {
        if (!list || !list.length) continue;
        const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, 'i');
        if (re.test(s)) {
          return { key: kw, list };
        }
      }
      return null;
    };

    const getRotation = (): Record<string, number> => {
      try { return JSON.parse(localStorage.getItem('__gifRotation') || '{}') as Record<string, number>; } catch { return {}; }
    };
    const setRotation = (key: string, idx: number) => {
      const m = getRotation();
      m[key] = idx;
      try { localStorage.setItem('__gifRotation', JSON.stringify(m)); } catch {}
    };

    const preloadImage = (src: string) => new Promise<boolean>((resolve) => { const im = new Image(); im.onload = () => resolve(true); im.onerror = () => resolve(false); im.src = src; });

    const tryUseOverride = async (hit: { key: string; list: GifOverride[] } | null) => {
      if (!hit) return false;
      const { key, list } = hit;
      const history = getHistory();
      const rot = getRotation();
      let start = Number.isInteger(rot[key]) ? rot[key] : -1;
      if (!list.length) return false;
      let attempts = list.length;
      while (attempts--) {
        const nextIdx = (start + 1) % list.length;
        const pick = list[nextIdx];
        start = nextIdx;
        if (!pick) continue;
        if (pick.url) {
          if (history.includes(pick.url)) continue;
          const ok = await preloadImage(pick.url);
          if (ok) {
            setRotation(key, nextIdx);
            if (!cancelled) setGif({ url: pick.url, link: pick.link, title: pick.title });
            pushHistory(pick.url);
            return true;
          }
        }
        if (pick.query) {
          const ok = await searchBoth([pick.query]);
          if (ok) { setRotation(key, nextIdx); return true; }
        }
      }
      return false;
    };

    (async () => {
      const overrideHit = findOverrideKey(intentText || text) || findOverrideKey(text);
      const usedOverride = await tryUseOverride(overrideHit);
      if (usedOverride) return;

      // Try new keywords from the current answer/query first (avoid ones used before)
      const kwFromText = extractKeywords(`${intentText} ${text} ${(related||[]).map(r=>r.title).join(' ')}`);
      const kwHistory = getKwHistory();
      const fresh = kwFromText.filter(k => !kwHistory.includes(k));
      for (const kw of fresh) { if (await tryKeyword(kw)) return; }

      // If none of the fresh words produced a GIF, retry previously used keywords (URL history prevents same GIF)
      for (let i = kwHistory.length - 1; i >= 0; i--) { if (await tryKeyword(kwHistory[i])) return; }

      // Final fallback: try subject tokens
      const catWords = (catTokens[category] || []).slice(0, 8);
      await searchBoth(catWords);
    })();

    return () => { cancelled = true; };
  }, [query, answer, related, hasInlineImage]);

  const fallbackGif = 'data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
  if (hasInlineImage || !gif) {
    return null;
  }
  const onError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const el = e.currentTarget as HTMLImageElement;
    if (el.src !== fallbackGif) el.src = fallbackGif;
  };
  const img = (<img src={gif.url} alt={gif.title || 'gif'} className="answer-gif rounded-lg" onError={onError} />);
  return <div className="px-4 mb-4 answer-gif-wrapper">{gif.link ? <a href={gif.link} target="_blank" rel="noopener noreferrer">{img}</a> : img}</div>;
};

const FileLinksSection: React.FC<{ files: FileLink[] }> = ({ files }) => {
  return (
    <div className="mt-6">
      <h5 className="font-semibold text-gray-800 mb-2 px-4">Files</h5>
      {files.map((file, index) => (
        <a
          key={index}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 my-1 rounded-lg hover:bg-gray-100 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{file.title}</span>
        </a>
      ))}
    </div>
  );
};

const SuggestionsSection: React.FC<{
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}> = ({ suggestions, onSuggestionClick }) => {
  const [clickedSuggestions, setClickedSuggestions] = useState<Set<string>>(new Set());

  const handleSuggestionClick = (suggestion: string) => {
    // Mark this suggestion as clicked
    setClickedSuggestions(prev => new Set(prev.add(suggestion)));
    // Call the original click handler
    onSuggestionClick(suggestion);
  };

  return (
    <div className="mt-6">
      <h5 className="font-semibold text-gray-800 mb-3 px-4">Suggested Questions</h5>
      <div className="px-4">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className={`suggestion-button flex items-center justify-between w-full text-left text-sm ${clickedSuggestions.has(suggestion) ? 'clicked' : 'text-gray-700'
              }`}>
            <span>{suggestion}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

// Utility functions
const safeRenderMarkdown = (content: string): string => {
  try {
    // Process the content through our preprocessing pipeline
    const processed = preprocessResponse(content);

    // Convert to HTML using marked
    const html = marked(processed) as string;

    // Basic XSS protection - remove dangerous attributes and scripts
    let safeHtml = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');

    // Fix cases where a leading '#' remains inside heading tags
    safeHtml = safeHtml.replace(/<(h[1-6])(\b[^>]*)>#{1,6}\s+/gi, '<$1$2>');
    // Remove any empty headings that may have been introduced
    safeHtml = safeHtml.replace(/<h[1-6][^>]*>\s*<\/h[1-6]>/gi, '');

    return safeHtml;
  } catch (error) {
    console.error('Error rendering markdown:', error);
    return content; // Fallback to plain text
  }
};

const renderTables = (answer: string, tables: Table[]): string => {
  // No data: remove any placeholders or raw <table> blocks from the answer
  if (!tables || tables.length === 0) {
    let cleaned = answer.replace(/\[TABLE:.+?\]/g, '');
    cleaned = cleaned.replace(/<table[\s\S]*?<\/table>/gi, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    return cleaned;
  }

  const buildTableHtml = (table: Table) => {
    let tableHtml = `<div class=\"overflow-x-auto my-4\">`;
    tableHtml += `<table class=\"min-w-full border border-gray-300 rounded-lg overflow-hidden shadow-sm\">`;
    tableHtml += `<caption class=\"p-2 text-sm text-gray-500 font-medium text-left\">${table.title}</caption>`;
    if (table.headers && table.headers.length > 0) {
      tableHtml += `<thead class=\"bg-gray-100\">`;
      tableHtml += `<tr>${table.headers.map(h => `<th class=\"p-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider\">${h}</th>`).join('')}</tr>`;
      tableHtml += `</thead>`;
    }
    tableHtml += `<tbody class=\"divide-y divide-gray-200\">`;
    (table.rows || []).forEach(row => {
      tableHtml += `<tr class=\"bg-white\">`;
      tableHtml += row.map(cell => `<td class=\"p-3 text-sm text-gray-800\">${cell}</td>`).join('');
      tableHtml += `</tr>`;
    });
    tableHtml += `</tbody>`;
    tableHtml += `</table></div>`;
    return tableHtml;
  };

  let processedAnswer = answer;
  const used = new Set<string>();

  // Replace placeholders with actual tables
  tables.forEach(table => {
    const placeholder = `[TABLE:${table.title}]`;
    if (processedAnswer.includes(placeholder)) {
      processedAnswer = processedAnswer.replace(placeholder, buildTableHtml(table));
      used.add(table.title);
    }
  });

  // Remove any leftover placeholders
  processedAnswer = processedAnswer.replace(/\[TABLE:.+?\]/g, '');

  // Append remaining tables (when no placeholders present for them)
  const remaining = tables.filter(t => !used.has(t.title));
  if (remaining.length) {
    const appended = remaining.map(buildTableHtml).join('');
    processedAnswer = `${processedAnswer}${processedAnswer ? '\n\n' : ''}${appended}`;
  }

  return processedAnswer;
};

const getIconSVG = (iconName: string): string => {
  const icons: { [key: string]: string } = {
    location: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 6.5c1.5-2 4-3 6.5-2l2 2a1 1 0 010 1.4L9 10a12 12 0 005 5l2.1-1.5a1 1 0 011.4 0l2 2c1 2.5 0 5-2 6.5-.6.4-1.4.5-2.1.2C10.2 20.5 3.5 13.8 1.8 6.6c-.3-.7-.2-1.5.2-2.1z"/></svg>`,
    mobile: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 1h-7a.5.5 0 00-.5.5v21a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V1.5a.5.5 0 00-.5-.5zM12 22a1 1 0 110-2 1 1 0 010 2z"/></svg>`,
    email: `<svg xmlns="http://www.w3.org/2000/svg" class="inline-block w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h18a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7l9 6 9-6" /></svg>`
  };
  return icons[iconName] || '';
};

const renderIcons = (text: string): string => {
  return text.replace(/\[ICON:(.*?)]/g, (match, iconName) => {
    return `<span class="inline-block align-middle">${getIconSVG(iconName.trim())}</span>`;
  });
};

const preprocessResponse = (text: string): string => {
  let processedText = text.replace(/&nbsp;|\u00A0|\t/g, ' ');
  processedText = processedText.replace(/([^\n])---/g, '$1\n\n---\n\n');
  processedText = processedText.replace(/^(\s*)\*\s+/gm, '$1* ');
  processedText = processedText.replace(/^(#+)(?! )/gm, '$1 ');
  processedText = processedText.replace(/^(\s*>)(?! )/gm, '$1 ');
  return processedText.trim();
};

const fetchImageDataUrl = async (src: string): Promise<string> => {
  const proxied = getExportableImageUrl(src);
  const res = await fetch(proxied);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Image load failed'));
    reader.readAsDataURL(blob);
  });
};

const fetchImageBytes = async (src: string): Promise<Uint8Array> => {
  const proxied = getExportableImageUrl(src);
  const res = await fetch(proxied);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
};

const getImageNaturalSize = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve({ width: im.naturalWidth || im.width, height: im.naturalHeight || im.height });
    im.onerror = () => resolve({ width: 400, height: 150 });
    im.src = dataUrl;
  });
};

const getExportableImageUrl = (src: string): string => {
  if (!src) return src;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  try {
    const u = new URL(src, window.location.href);
    if (u.origin === window.location.origin) return src;
  } catch {}
  const proxy = process.env.REACT_APP_IMAGE_PROXY || 'https://images.weserv.nl/?url=';
  const cleaned = src.replace(/^https?:\/\//, '');
  return proxy + encodeURIComponent(cleaned);
};

const resolveWebhook = (): string => {
  const envHook = ((process.env.REACT_APP_N8N_WEBHOOK || (process.env as any).REACT_APP_FORM_WEBHOOK) || '').toString().trim();
  if (envHook) {
    try { localStorage.setItem('__n8n_hook', envHook); } catch {}
    return envHook;
  }
  try {
    const ls = localStorage.getItem('__n8n_hook');
    if (ls) return ls.trim();
  } catch {}
  try {
    const u = new URL(window.location.href);
    const q = (u.searchParams.get('n8n') || u.searchParams.get('webhook') || '').toString().trim();
    if (q) {
      try { localStorage.setItem('__n8n_hook', q); } catch {}
      return q;
    }
  } catch {}
  return '';
};

export default App;
