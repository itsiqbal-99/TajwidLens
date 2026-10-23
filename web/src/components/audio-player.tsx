"use client";

import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type AudioSource = { src: string; label: string; attribution: string };

export function AudioPlayer({ source }: { source?: AudioSource }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const current = audio.current;
    return () => { current?.pause(); if (current) current.currentTime = 0; };
  }, [source?.src]);

  if (!source) return <div className="audio-unavailable"><Volume2 size={18} aria-hidden="true" /><span>Audio untuk contoh ini belum tersedia dari sumber yang dapat didistribusikan.</span></div>;

  async function toggle() {
    if (!audio.current) return;
    if (audio.current.paused) {
      setLoading(true);
      try { await audio.current.play(); setError(false); } catch { setError(true); setLoading(false); }
    } else audio.current.pause();
  }

  return <div className="audio-player">
    <audio ref={audio} src={source.src} preload="metadata" onPlay={() => { setPlaying(true); setLoading(false); }} onPause={() => setPlaying(false)} onWaiting={() => setLoading(true)} onCanPlay={() => setLoading(false)} onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onError={() => { setError(true); setLoading(false); }} />
    <div className="audio-main"><button type="button" className="audio-play" onClick={toggle} aria-label={playing ? "Jeda audio" : "Putar audio"} disabled={loading || error}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><div className="audio-body"><strong>{source.label}</strong><input type="range" min="0" max={duration || 1} value={Math.min(time, duration || 1)} step="0.1" onChange={(event) => { if (audio.current) audio.current.currentTime = Number(event.target.value); }} aria-label="Posisi audio" disabled={!duration} /><small>{loading ? "Memuat audio…" : error ? "Audio gagal dimuat" : source.attribution}</small></div><button className="icon-button" type="button" title="Ulangi" aria-label="Ulangi audio" onClick={() => { if (audio.current) { audio.current.currentTime = 0; void audio.current.play(); } }} disabled={error}><RotateCcw size={17} /></button></div>
    <label className="audio-speed">Kecepatan <select value={speed} onChange={(event) => { const value = Number(event.target.value); setSpeed(value); if (audio.current) audio.current.playbackRate = value; }}><option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option></select></label>
  </div>;
}
