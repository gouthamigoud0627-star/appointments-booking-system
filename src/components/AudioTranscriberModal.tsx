/**
 * AudioTranscriberModal Component
 * Provides live, real-time transcription of any audio feed (microphone or audio stream)
 * and audio file transcription powered by Gemini Live & Transcribe API (gemini-3.5-transcribe).
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  X,
  FileAudio,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  Play,
  Square,
  Upload,
  Search,
} from 'lucide-react';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TranscriptTurn {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'live' | 'file'>('live');
  const [isRecording, setIsRecording] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('Ready to stream live audio feed.');
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([
    {
      id: 'welcome-tr',
      speaker: 'System',
      text: 'Click "Start Live Audio Feed" to begin real-time speech-to-text transcription powered by Gemini.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isFinal: true,
    },
  ]);

  // Audio & Stream refs
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // File Upload State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileTranscript, setFileTranscript] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  // Search & Copy State
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      stopLiveFeed();
    };
  }, []);

  // Visualizer Animation
  const drawWaveform = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#4f46e5';
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    render();
  };

  // Start Live Audio Feed
  const startLiveFeed = async () => {
    try {
      setConnectionStatus('connecting');
      setStatusMessage('Requesting audio input permissions...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      mediaStreamRef.current = stream;

      // AudioContext for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      drawWaveform(analyser);

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/transcribe-live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        setStatusMessage('Streaming live audio to Gemini transcribe engine...');
        setIsRecording(true);

        // Start MediaRecorder chunking
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 16000 });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              if (base64) {
                ws.send(JSON.stringify({ type: 'audio_chunk', audio: base64, mimeType }));
              }
            };
            reader.readAsDataURL(e.data);
          }
        };

        recorder.start(1500); // 1.5s slice
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'transcript' && data.text) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `turn-${Date.now()}-${Math.random()}`,
                speaker: 'Live Audio',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                isFinal: Boolean(data.isFinal),
              },
            ]);
          } else if (data.type === 'status') {
            setStatusMessage(data.message || 'Engine active.');
          }
        } catch (_) {}
      };

      ws.onerror = () => {
        setConnectionStatus('error');
        setStatusMessage('WebSocket connection error.');
      };

      ws.onclose = () => {
        setIsRecording(false);
        setConnectionStatus('idle');
      };
    } catch (err: any) {
      console.error('Audio capture error:', err);
      setConnectionStatus('error');
      setStatusMessage(err?.message || 'Microphone access denied.');
      setIsRecording(false);
    }
  };

  // Stop Live Audio Feed
  const stopLiveFeed = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'flush' }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('idle');
    setStatusMessage('Live audio stream paused.');
  };

  // Transcribe File Handler
  const handleFileTranscribe = async () => {
    if (!audioFile) return;
    setFileLoading(true);
    setFileError(null);
    setFileTranscript('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audio: base64,
              mimeType: audioFile.type || 'audio/webm',
            }),
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json.error || 'Transcription failed.');
          }
          setFileTranscript(json.text || 'No speech detected.');
        } catch (e: any) {
          setFileError(e?.message || 'Failed to transcribe file.');
        } finally {
          setFileLoading(false);
        }
      };
      reader.readAsDataURL(audioFile);
    } catch (err: any) {
      setFileError(err?.message || 'Could not read audio file.');
      setFileLoading(false);
    }
  };

  const handleCopyTranscript = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fullLiveText = transcripts.map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`).join('\n');
  const filteredTranscripts = transcripts.filter((t) =>
    searchQuery ? t.text.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b border-slate-150 dark:border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Radio className={`w-5 h-5 ${isRecording ? 'animate-pulse text-rose-300' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Live Audio Transcriber
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time speech transcription for consultations, voice notes, and meeting feeds
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopLiveFeed();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 dark:border-slate-800 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Live Audio Feed</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopLiveFeed();
              setActiveTab('file');
            }}
            className={`pb-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>Transcribe Audio File</span>
          </button>
        </div>

        {/* Tab 1: Live Audio Feed */}
        {activeTab === 'live' && (
          <div className="flex-1 flex flex-col p-5 sm:p-6 space-y-4 overflow-hidden">
            {/* Waveform Visualizer & Status */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={500}
                height={60}
                className="w-full h-14 block"
              />
              <div className="flex items-center justify-between w-full pt-2 text-[11px] text-slate-400 border-t border-slate-800 mt-2">
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                    }`}
                  />
                  <span>{statusMessage}</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {isRecording ? 'LIVE STREAMING' : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* Transcript Search & Filter */}
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spoken keywords in transcript..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setTranscripts([])}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                title="Clear transcript"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Live Streaming Transcript Feed */}
            <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              {filteredTranscripts.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  No matching transcript words found.
                </div>
              ) : (
                filteredTranscripts.map((turn) => (
                  <div
                    key={turn.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                      <span className="text-indigo-600 dark:text-indigo-400">{turn.speaker}</span>
                      <span>{turn.timestamp}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {turn.text}
                    </p>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyTranscript(fullLiveText)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTranscript(fullLiveText, `live-transcript-${Date.now()}.txt`)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export TXT</span>
                </button>
              </div>

              {!isRecording ? (
                <button
                  type="button"
                  onClick={startLiveFeed}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Live Audio Feed</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopLiveFeed}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 animate-pulse"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Live Feed</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Transcribe Audio File */}
        {activeTab === 'file' && (
          <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col overflow-y-auto">
            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50 dark:bg-slate-800/50">
              <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Upload an audio recording or voicemail
                </p>
                <p className="text-xs text-slate-500">Supports MP3, WAV, WebM, M4A, OGG</p>
              </div>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAudioFile(e.target.files[0]);
                  }
                }}
                className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
              />
            </div>

            {audioFile && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-950 dark:text-indigo-200 truncate max-w-xs">
                  {audioFile.name} ({(audioFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  disabled={fileLoading}
                  onClick={handleFileTranscribe}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {fileLoading ? 'Transcribing...' : 'Transcribe Now'}
                </button>
              </div>
            )}

            {fileError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{fileError}</span>
              </div>
            )}

            {fileTranscript && (
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Verbatim Audio Transcription:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyTranscript(fileTranscript)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadTranscript(fileTranscript, `${audioFile?.name || 'audio'}-transcript.txt`)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed max-h-56 overflow-y-auto">
                  {fileTranscript}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
