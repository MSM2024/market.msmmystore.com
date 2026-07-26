'use client'

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, RefreshCw, Info, User, Award } from "lucide-react"
import type { ChatMessage } from "@/lib/gemology-types"

export default function AiAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Salutations! I am **Zafiro AI**, your senior gemological advisor. Ask me anything about the deep mineralogy, chemistry, history, or valuation profiles of sapphires and other fine corundums.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const starterPills = [
    "What makes Kashmir sapphires so unique?",
    "Explain the 'velvety' sleepy luster.",
    "What is a Padparadscha?",
    "How do I spot synthetic corundum?"
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return
    const userMsgText = textToSend
    setInput("")

    const userMessage: ChatMessage = {
      role: "user",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const historyPayload = messages.map(m => ({ role: m.role, text: m.text }))
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsgText, history: historyPayload })
      })

      if (!response.ok) throw new Error(`Server returned status code ${response.status}`)

      const data = await response.json()
      const modelMessage: ChatMessage = {
        role: "model",
        text: data.text || "Pardon, I encountered an unresolvable diagnostic readout from the server.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, modelMessage])
    } catch (err: unknown) {
      console.error("Failed to connect with Zafiro AI:", err)
      const errorMessage: ChatMessage = {
        role: "model",
        text: `**System Notice:** Could not establish handshake with the AI node.\n\n*Error details:* ${err instanceof Error ? err.message : "Connection refused."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearHistory = () => {
    setMessages([{
      role: "model",
      text: "Salutations! I am **Zafiro AI**, your senior gemological advisor.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 flex flex-col h-[520px] xs:h-[580px] rounded-2xl bg-[#090d16] border border-[#1e293b] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#020308] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-800/40 rounded-xl">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-serif">
                Zafiro AI Chat
              </h3>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Senior Advisor Node
              </p>
            </div>
          </div>
          <button
            onClick={handleClearHistory}
            className="px-3 py-2 border border-slate-800 hover:border-slate-700 bg-[#090d16] text-slate-400 hover:text-slate-200 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5"
            style={{ minHeight: "40px" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Feed</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#020308]/60">
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user"
            return (
              <div key={idx} className={`flex space-x-3 max-w-[90%] sm:max-w-[85%] ${isUser ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"}`}>
                <div className={`p-2 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center border ${isUser ? "bg-blue-950 border-blue-800/80 text-blue-400" : "bg-[#090d16] border-slate-800 text-indigo-400 shadow-md"}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${isUser ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-indigo-950/20" : "bg-[#090d16] text-slate-200 border border-slate-800/80 rounded-tl-none font-serif"}`}>
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.text.split("\n").map((line, lIdx) => {
                        if (line.trim().startsWith("* **") || line.trim().startsWith("*")) {
                          return (
                            <li key={lIdx} className="ml-4 list-disc text-slate-300">
                              {line.replace(/^\*\s*/, "").replace(/\*\*/g, "")}
                            </li>
                          )
                        }
                        return <p key={lIdx} className="leading-relaxed">{line.replace(/\*\*/g, "")}</p>
                      })}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono text-slate-500 block font-bold uppercase tracking-wider ${isUser ? "text-right" : "text-left"}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            )
          })}

          {isLoading && (
            <div className="flex space-x-3 max-w-[80%] mr-auto items-center">
              <div className="p-2 rounded-xl bg-[#090d16] border border-slate-800 text-indigo-400 shrink-0 h-9 w-9 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-[#090d16] border border-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none flex space-x-1 items-center h-9 shadow-inner">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-[#020308] border-t border-slate-800/80 space-y-3.5">
          {messages.length === 1 && (
            <div className="flex gap-2 pb-1 max-w-full overflow-x-auto snap-x">
              {starterPills.map((pill) => (
                <button
                  key={pill}
                  onClick={() => handleSendMessage(pill)}
                  className="px-3.5 py-2 text-[10px] font-mono text-slate-400 hover:text-indigo-400 border border-slate-800 hover:border-indigo-800/60 bg-[#090d16] rounded-full transition-all text-left whitespace-nowrap snap-center cursor-pointer font-bold"
                  style={{ minHeight: "36px" }}
                >
                  {pill}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input) }}
            className="flex items-center space-x-3"
          >
            <input
              type="text"
              placeholder="Ask about mineralogy, pleochroism, famous sapphires..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#090d16] border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-500 transition-all h-11 sm:h-12"
              style={{ minHeight: "44px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 shadow-md shadow-indigo-950/40 cursor-pointer flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 shrink-0"
              style={{ minHeight: "44px" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="rounded-2xl bg-[#090d16] border border-[#1e293b] p-5 sm:p-6 space-y-4 shadow-lg">
          <h4 className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-3 font-bold">
            <Info className="w-4 h-4 text-indigo-400" /> System Protocols
          </h4>
          <div className="space-y-3 text-xs text-slate-400 leading-relaxed font-serif">
            <p>**Zafiro AI** is dynamically mapped directly to a premium server-side **Gemini 3.5 Flash** agent.</p>
            <p>The engine evaluates core mineral physics, historic ownership logs, and grading metrics to respond with academic-level rigor.</p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 space-y-2">
            <h5 className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-extrabold">Suggested Fields of Study:</h5>
            <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" /> Geological formation of Corundum</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" /> Rutile silk asterism causes</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" /> Beryllium thermochemical diffusion</li>
              <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 bg-indigo-400 rounded-full" /> Historic Mogok stone logs</li>
            </ul>
          </div>
        </div>
        <div className="rounded-xl bg-indigo-950/20 border border-indigo-900/40 p-5 space-y-3 text-xs shadow-inner">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Award className="w-5 h-5 text-indigo-400" />
            <h5 className="font-semibold text-slate-200">GIA Standard Verification</h5>
          </div>
          <p className="text-slate-400 font-serif leading-relaxed">
            All details generated by Zafiro&apos;s AI are advisory. True certification requires specialized polariscopes, refractometers, and trace element mass spectrometry.
          </p>
        </div>
      </div>
    </div>
  )
}
