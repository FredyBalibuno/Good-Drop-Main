"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, ImagePlus, Loader2, Trash2, Volume2, VolumeX } from "lucide-react";
import { apiUrl } from "@/lib/api";

type Role = "user" | "assistant";

interface Message {
  id: string;
  role: Role;
  text: string;
  image?: string; // data URL for display
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function DonationChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I can help you figure out what Goodwill DC will and won't accept. Ask me about any item — or upload a photo and I'll take a look.",
    },
  ]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const speak = useCallback(async (id: string, text: string) => {
    if (speakingId === id) {
      audioRef.current?.pause();
      setSpeakingId(null);
      return;
    }
    audioRef.current?.pause();
    setSpeakingId(id);
    try {
      const res = await fetch(apiUrl("/api/tts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeakingId(null);
      audio.onerror = () => setSpeakingId(null);
      void audio.play();
    } catch {
      setSpeakingId(null);
    }
  }, [speakingId]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const handleImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text && !image) return;
    if (loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || "What do you think of this item?",
      image: image ?? undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setImage(null);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text, history, image: userMsg.image ?? null }),
      });

      const data = await res.json() as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: data.reply ?? data.error ?? "Sorry, something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: "I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, image, loading, messages]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  }, [send]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      text: "Hi! I can help you figure out what Goodwill DC will and won't accept. Ask me about any item — or upload a photo and I'll take a look.",
    }]);
  }, []);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-sky-700 text-white shadow-lg hover:bg-sky-800 transition-colors"
        aria-label="Open donation assistant"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex w-[min(92vw,380px)] flex-col rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-sky-700 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Donation Assistant</p>
              <p className="text-xs text-sky-200">Goodwill DC acceptance guide</p>
            </div>
            <button type="button" onClick={clearChat} className="text-sky-200 hover:text-white transition-colors" aria-label="Clear chat">
              <Trash2 className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "380px" }}>
            {messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
                {m.image && (
                  <img src={m.image} alt="uploaded" className="max-h-40 max-w-[220px] rounded-xl object-cover border border-border/40" />
                )}
                <div className="flex items-end gap-1">
                  {m.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => void speak(m.id, m.text)}
                      className="shrink-0 text-muted-foreground hover:text-sky-600 transition-colors mb-1"
                      aria-label="Read aloud"
                    >
                      {speakingId === m.id ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                    </button>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-sky-700 text-white rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-muted">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview */}
          {image && (
            <div className="relative mx-4 mb-2 w-fit">
              <img src={image} alt="preview" className="h-16 rounded-xl object-cover border border-border/40" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-white"
              >
                <X className="size-3" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 border-t border-border/60 p-3">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Upload image"
            >
              <ImagePlus className="size-5" />
            </button>
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about any item…"
              className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
              style={{ maxHeight: "100px" }}
            />
            <Button
              size="sm"
              disabled={(!input.trim() && !image) || loading}
              onClick={() => void send()}
              className="shrink-0 rounded-full bg-sky-700 hover:bg-sky-800 text-white h-9 w-9 p-0"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
