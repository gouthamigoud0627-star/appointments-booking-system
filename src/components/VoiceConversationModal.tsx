import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  PhoneOff,
  Radio,
  Send,
  RefreshCw,
  MessageSquare,
  Zap,
  Info,
  User,
  Bot
} from 'lucide-react';
import { VoiceTranscriptMessage } from '../types';

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
  businessName,
}) => {
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start conversational voice session.');
  const [transcripts, setTranscripts] = useState<VoiceTranscriptMessage[]>([]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Quick suggestion chips
  const suggestedPrompts = [
    'What services do you offer?',
    'Who is Dr. Elena Rostova?',
    'Check Marcus Vance availability',
    'What is your cancellation deposit policy?',
  ];

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Connect WebSocket & Audio when modal opens
  useEffect(() => {
    if (isOpen) {
      startVoiceSession();
    } else {
      stopVoiceSession();
    }
    return () => {
      stopVoiceSession();
    };
  }, [isOpen]);

  // Visualizer Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Draw flowing sine waves based on session status & audio level
      const isActive = sessionStatus === 'listening' || sessionStatus === 'speaking';
      const amp = isActive ? Math.max(15, audioLevel * 45) : 4;
      const speed = sessionStatus === 'speaking' ? 0.08 : 0.04;

      phase += speed;

      // Gradient wave
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      if (sessionStatus === 'speaking') {
        gradient.addColorStop(0, '#6366F1');
        gradient.addColorStop(0.5, '#EC4899');
        gradient.addColorStop(1, '#8B5CF6');
      } else if (sessionStatus === 'listening') {
        gradient.addColorStop(0, '#10B981');
        gradient.addColorStop(0.5, '#3B82F6');
        gradient.addColorStop(1, '#059669');
      } else {
        gradient.addColorStop(0, '#CBD5E1');
        gradient.addColorStop(1, '#94A3B8');
      }

      ctx.beginPath();
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;

      for (let x = 0; x < width; x++) {
        const angle = (x / width) * Math.PI * 4 + phase;
        const y = centerY + Math.sin(angle) * amp * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second harmonic wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < width; x++) {
        const angle = (x / width) * Math.PI * 6 - phase * 0.8;
        const y = centerY + Math.cos(angle) * (amp * 0.6) * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, sessionStatus, audioLevel]);

  const startVoiceSession = async () => {
    setSessionStatus('connecting');
    setStatusMessage('Connecting to Gemini Live Voice Stream...');

    // 1. Establish WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/live-voice`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setSessionStatus('connected');
      setStatusMessage('Voice channel connected. Initializing audio pipeline...');
      // Start microphone streaming
      initMicrophone(ws);
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'status') {
          if (msg.status === 'ready' || msg.status === 'fallback') {
            setSessionStatus('listening');
            setStatusMessage(msg.message || 'Gemini Live ready. Speak freely into your mic!');
          } else {
            setStatusMessage(msg.message || `Status: ${msg.status}`);
          }
        }

        if (msg.type === 'transcript') {
          setTranscripts((prev) => [
            ...prev,
            {
              id: 'tr-' + Date.now() + Math.random(),
              role: msg.role,
              text: msg.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            },
          ]);

          if (msg.role === 'assistant') {
            setSessionStatus('speaking');
            setAudioLevel(0.8);
            // If speaker is not muted, use speech synthesis if raw PCM audio not returned
            if (!isSpeakerMuted && 'speechSynthesis' in window) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(msg.text);
              utterance.rate = 1.05;
              utterance.pitch = 1.0;
              utterance.onend = () => {
                setSessionStatus('listening');
                setAudioLevel(0.1);
              };
              window.speechSynthesis.speak(utterance);
            } else {
              setTimeout(() => {
                setSessionStatus('listening');
                setAudioLevel(0.1);
              }, 2500);
            }
          }
        }

        if (msg.type === 'audio' && msg.data) {
          // Play raw PCM audio chunk
          setSessionStatus('speaking');
          setAudioLevel(0.9);
          if (!isSpeakerMuted) {
            playPcmAudio(msg.data);
          }
        }

        if (msg.type === 'error') {
          setStatusMessage(`Live Voice notice: ${msg.error}`);
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('WebSocket connection notice:', err);
      setSessionStatus('error');
      setStatusMessage('Voice channel offline. Text-to-speech fallback ready.');
    };

    ws.onclose = () => {
      console.log('Live Voice WebSocket closed');
    };
  };

  const initMicrophone = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMicMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Calculate volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setAudioLevel(Math.min(1, rms * 5));

        // Convert Float32 to Int16 PCM
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Convert to Base64
        const binary = String.fromCharCode.apply(null, Array.from(new Uint8Array(pcm16.buffer)));
        const base64 = btoa(binary);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'realtime_input',
              audio: base64,
              mimeType: 'audio/pcm;rate=16000',
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Also attach Web Speech Recognition for instant natural transcription
      initSpeechRecognition(ws);
    } catch (err: any) {
      console.warn('Microphone stream access not granted or not supported:', err?.message);
      setStatusMessage('Microphone inactive. You can use instant text prompts below.');
    }
  };

  const initSpeechRecognition = (ws: WebSocket) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        if (isMicMuted) return;
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript.length > 0) {
            handleSendSpokenTurn(transcript);
          }
        }
      };

      recognition.onerror = (e: any) => {
        // Silently recover on speech recognition restarts
        if (e.error !== 'no-speech') {
          console.warn('SpeechRecognition warning:', e.error);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
    }
  };

  const playPcmAudio = (base64Data: string) => {
    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        setSessionStatus('listening');
        setAudioLevel(0.1);
      };
      source.start();
    } catch (e) {
      console.error('PCM playback error:', e);
    }
  };

  const stopVoiceSession = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setSessionStatus('idle');
    setAudioLevel(0);
  };

  const handleSendSpokenTurn = (text: string) => {
    if (!text.trim()) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'text_input',
          text: text.trim(),
        })
      );
    } else {
      // Offline direct client simulation
      setTranscripts((prev) => [
        ...prev,
        {
          id: 'tr-' + Date.now(),
          role: 'user',
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setTimeout(() => {
        const reply = `I'm happy to help you with that! At ${businessName}, we have specialist team members ready to book. Would you like me to reserve a session for you?`;
        setTranscripts((prev) => [
          ...prev,
          {
            id: 'tr-' + (Date.now() + 1),
            role: 'assistant',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        if (!isSpeakerMuted && 'speechSynthesis' in window) {
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
        }
      }, 700);
    }
    setTextPrompt('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        id="voice-conversation-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  sessionStatus === 'listening' || sessionStatus === 'speaking'
                    ? 'bg-emerald-400 animate-pulse'
                    : sessionStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Gemini Live Voice Concierge</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  Live API
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <span>{statusMessage}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-voice-modal-btn"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Audio Visualizer Stage */}
        <div className="bg-slate-950 px-6 py-4 flex flex-col items-center justify-center relative overflow-hidden border-b border-slate-800">
          <canvas ref={canvasRef} width={560} height={70} className="w-full h-16 max-w-lg" />
          <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>
                {sessionStatus === 'speaking'
                  ? 'Gemini Live Speaking'
                  : sessionStatus === 'listening'
                  ? 'Listening for Voice Input...'
                  : 'Connecting stream...'}
              </span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Model: gemini-2.0-flash-exp</span>
          </div>
        </div>

        {/* Conversation Transcript Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/70 min-h-[220px] max-h-[340px]">
          {transcripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                <Mic className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">Start Speaking Naturally</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Say hello, ask about appointments, specialist schedules, services offered, or click one of the suggested voice prompts below.
              </p>
            </div>
          ) : (
            transcripts.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.role === 'user' ? 'You' : 'Gemini Concierge'}
                    </span>
                    <span className={`text-[10px] ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Suggested Voice Prompt Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try Asking:
          </span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendSpokenTurn(p)}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-200/80"
            >
              "{p}"
            </button>
          ))}
        </div>

        {/* Voice Controls & Input Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Audio Toggles */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsMicMuted(!isMicMuted)}
              id="btn-voice-toggle-mic"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                isMicMuted
                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
              title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMicMuted ? 'Mic Muted' : 'Mic Live'}</span>
            </button>

            <button
              onClick={() => {
                if (!isSpeakerMuted && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
                setIsSpeakerMuted(!isSpeakerMuted);
              }}
              id="btn-voice-toggle-speaker"
              className={`p-2 rounded-xl text-xs transition-colors border ${
                isSpeakerMuted
                  ? 'bg-slate-200 text-slate-600 border-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isSpeakerMuted ? 'Unmute audio output' : 'Mute audio output'}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={startVoiceSession}
              id="btn-voice-reconnect"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Restart session connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Fallback Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendSpokenTurn(textPrompt);
            }}
            className="flex items-center gap-2 w-full sm:w-auto flex-1 sm:max-w-xs"
          >
            <input
              type="text"
              placeholder="Or type a message here..."
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!textPrompt.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* End Call Button */}
          <button
            onClick={onClose}
            id="btn-voice-end-call"
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-200 transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
};
