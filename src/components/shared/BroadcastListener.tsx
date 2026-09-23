'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { Radio, Volume2, VolumeX, Music, Headphones, Play, AlertCircle, Mic } from 'lucide-react';
import type { BroadcastState } from '@/utils/storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { DocumentSnapshot, FirestoreError } from 'firebase/firestore';

// ─── Volume constants ─────────────────────────────────────────────────────────
// Pag nag-mic ang DJ, hihina ang music sa levels na ito
const YT_NORMAL_VOL   = 100;  // YouTube volume (0–100)
const YT_DUCKED_VOL   = 20;   // YouTube volume habang may mic
const AUD_NORMAL_VOL  = 1;    // HTML5 audio volume (0–1)
const AUD_DUCKED_VOL  = 0.2;  // HTML5 audio volume habang may mic

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split(/[?&#]/)[0] ?? null;
    if (url.includes('youtube.com/watch')) return new URLSearchParams(url.split('?')[1] ?? '').get('v');
    if (url.includes('youtube.com/embed/')) return url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0] ?? null;
  } catch { return null; }
  return null;
};

const isYouTubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

const base64ToArrayBuffer = (b64: string): ArrayBuffer => {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function BroadcastListener() {
  const { user } = useAuth();
  const [state, setState]           = useState<BroadcastState | null>(null);
  const [userJoined, setUserJoined] = useState(false);
  const [isMuted, setIsMuted]       = useState(false);
  const [micActive, setMicActive]   = useState(false);

  // YouTube iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // HTML5 audio fallback for non-YouTube streams
  const audioRef  = useRef<HTMLAudioElement>(null);

  // ── MSE (MediaSource Extensions) for gapless mic streaming ───────────────
  const micAudioRef     = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef  = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const chunkQueueRef   = useRef<ArrayBuffer[]>([]);   // pending while SB is busy
  const mseReadyRef     = useRef(false);
  const lastSeqRef      = useRef(-1);

  // Mirror state in refs para laging fresh ang value sa Firestore callbacks
  const userJoinedRef = useRef(false);
  const isMutedRef    = useRef(false);
  const micActiveRef  = useRef(false);
  useEffect(() => { userJoinedRef.current = userJoined; }, [userJoined]);
  useEffect(() => { isMutedRef.current    = isMuted;    }, [isMuted]);
  useEffect(() => { micActiveRef.current  = micActive;  }, [micActive]);

  // ─── SourceBuffer drain helper ────────────────────────────────────────────
  const drainQueue = useCallback(() => {
    const sb = sourceBufferRef.current;
    const ms = mediaSourceRef.current;
    if (!sb || sb.updating || chunkQueueRef.current.length === 0) return;
    if (!ms || ms.readyState !== 'open') return;
    try {
      sb.appendBuffer(chunkQueueRef.current.shift()!);
    } catch (e) {
      console.warn('MSE appendBuffer failed:', e);
    }
  }, []);

  // ─── Enqueue one audio chunk ──────────────────────────────────────────────
  const enqueueMicData = useCallback((b64: string) => {
    if (!mseReadyRef.current || !sourceBufferRef.current) return;
    const buf = base64ToArrayBuffer(b64);
    chunkQueueRef.current.push(buf);
    drainQueue();
  }, [drainQueue]);

  // ─── Tear down MSE session cleanly ────────────────────────────────────────
  const teardownMSE = useCallback(() => {
    mseReadyRef.current   = false;
    chunkQueueRef.current = [];
    lastSeqRef.current    = -1;
    try {
      if (mediaSourceRef.current?.readyState === 'open') {
        mediaSourceRef.current.endOfStream();
      }
    } catch {}
    if (micAudioRef.current) {
      micAudioRef.current.pause();
      try { URL.revokeObjectURL(micAudioRef.current.src); } catch {}
      micAudioRef.current.src = '';
      micAudioRef.current     = null;
    }
    mediaSourceRef.current  = null;
    sourceBufferRef.current = null;
  }, []);

  // ─── Initialize MSE ───────────────────────────────────────────────────────
  const initMSE = useCallback((initB64: string, mimeType: string) => {
    teardownMSE(); // Siguradong malinis bago mag-start

    const ms    = new MediaSource();
    const audio = new Audio();
    mediaSourceRef.current = ms;
    micAudioRef.current    = audio;
    audio.src = URL.createObjectURL(ms);

    ms.addEventListener('sourceopen', () => {
      const mime = MediaSource.isTypeSupported(mimeType) ? mimeType : 'audio/webm;codecs=opus';
      try {
        const sb = ms.addSourceBuffer(mime);
        sourceBufferRef.current = sb;
        sb.addEventListener('updateend', drainQueue);
        const initBuf = base64ToArrayBuffer(initB64);
        sb.appendBuffer(initBuf);
        mseReadyRef.current = true;
      } catch (e) {
        console.error('MSE SourceBuffer error:', e);
      }
    }, { once: true });

    audio.volume = isMutedRef.current ? 0 : 1;
    audio.play().catch((e) => console.warn('MSE play blocked:', e));
  }, [drainQueue, teardownMSE]);

  // ─── Firestore: broadcast current state ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'broadcast', 'current'),
      (snap: DocumentSnapshot) => setState(snap.exists() ? (snap.data() as BroadcastState) : null),
      (err: FirestoreError) => console.error('Broadcast sync error:', err)
    );
  }, [user]);

  // ─── Firestore: mic init segment ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'broadcast', 'micstream'),
      (snap: DocumentSnapshot) => {
        if (!snap.exists()) {
          setMicActive(false);
          micActiveRef.current = false;
          teardownMSE();
          return;
        }
        const { initSegment, mimeType, active } = snap.data() as any;
        if (!active) {
          setMicActive(false);
          micActiveRef.current = false;
          teardownMSE();
          return;
        }
        setMicActive(true);
        micActiveRef.current = true;
        if (userJoinedRef.current) {
          initMSE(initSegment, mimeType);
        }
      },
      (err: FirestoreError) => console.error('micstream sync error:', err)
    );
  }, [user, initMSE, teardownMSE]);

  // ─── Firestore: mic audio chunks ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'broadcast', 'micchunk'),
      (snap: DocumentSnapshot) => {
        if (!snap.exists()) return;
        const { data, seq, ts } = snap.data() as any;
        if (Date.now() - ts > 5000) return;
        if (seq <= lastSeqRef.current) return;
        lastSeqRef.current = seq;
        if (!userJoinedRef.current || !mseReadyRef.current) return;
        enqueueMicData(data);
      },
      (err: FirestoreError) => console.error('micchunk sync error:', err)
    );
  }, [user, enqueueMicData]);

  // ─── YouTube postMessage helper ───────────────────────────────────────────
  const sendYT = useCallback((func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      'https://www.youtube.com'
    );
  }, []);

  // ─── Audio Ducking Logic ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userJoined || isMuted) return;
    if (micActive) {
      sendYT('setVolume', [YT_DUCKED_VOL]);
      if (audioRef.current) audioRef.current.volume = AUD_DUCKED_VOL;
    } else {
      sendYT('setVolume', [YT_NORMAL_VOL]);
      if (audioRef.current) audioRef.current.volume = AUD_NORMAL_VOL;
    }
  }, [micActive, userJoined, isMuted, sendYT]);

  // ─── Sync DJ play/pause ───────────────────────────────────────────────────
  useEffect(() => {
    if (!userJoined) return;
    if (state?.isPlaying) {
      sendYT('playVideo');
      audioRef.current?.play().catch(() => {});
    } else {
      sendYT('pauseVideo');
      audioRef.current?.pause();
    }
  }, [state?.isPlaying, userJoined, sendYT]);

  // ─── Join Broadcast ───────────────────────────────────────────────────────
  const handleJoinBroadcast = useCallback(async () => {
    setUserJoined(true);
    userJoinedRef.current = true;
    setIsMuted(false);
    isMutedRef.current = false;

    const ytVol  = micActiveRef.current ? YT_DUCKED_VOL  : YT_NORMAL_VOL;
    const audVol = micActiveRef.current ? AUD_DUCKED_VOL : AUD_NORMAL_VOL;
    sendYT('unMute');
    sendYT('setVolume', [ytVol]);
    sendYT('playVideo');
    if (audioRef.current) {
      audioRef.current.muted  = false;
      audioRef.current.volume = audVol;
      audioRef.current.play().catch(() => {});
    }

    try {
      const micStreamSnap = await getDoc(doc(db, 'broadcast', 'micstream'));
      if (micStreamSnap.exists()) {
        const { initSegment, mimeType, active } = micStreamSnap.data() as any;
        if (active) {
          initMSE(initSegment, mimeType);
          setMicActive(true);
          micActiveRef.current = true;
        }
      }
    } catch (e) {
      console.warn('Could not fetch mic init segment:', e);
    }
  }, [sendYT, initMSE]);

  // ─── Mute toggle ─────────────────────────────────────────────────────────
  const handleToggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        sendYT('mute');
      } else {
        sendYT('unMute');
        sendYT('setVolume', [micActiveRef.current ? YT_DUCKED_VOL : YT_NORMAL_VOL]);
      }
      if (audioRef.current) {
        audioRef.current.muted = next;
        if (!next) audioRef.current.volume = micActiveRef.current ? AUD_DUCKED_VOL : AUD_NORMAL_VOL;
      }
      if (micAudioRef.current) micAudioRef.current.volume = next ? 0 : 1;
      return next;
    });
  }, [sendYT]);

  // Dito yung fix para hindi mawala ang boses kahit i-off yung kanta
  if (!state?.active && !micActive) return null;

  const isYT    = isYouTubeUrl(state?.sourceUrl ?? '');
  const videoId = getYouTubeVideoId(state?.sourceUrl ?? '');
  const origin  = typeof window !== 'undefined' ? window.location.origin : '';
  const ytSrc   = videoId
    ? `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
        autoplay: '1', mute: '1', controls: '0',
        enablejsapi: '1', origin, rel: '0', playsinline: '1', modestbranding: '1',
      }).toString()}`
    : null;

  return (
    <>
      {state?.active && isYT && ytSrc && (
        <iframe
          key={ytSrc} ref={iframeRef} src={ytSrc}
          allow="autoplay; encrypted-media" aria-hidden="true"
          style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', border: 'none', pointerEvents: 'none' }}
        />
      )}
      {state?.active && !isYT && state?.sourceUrl && (
        <audio key={state.sourceUrl} ref={audioRef} src={state.sourceUrl}
          autoPlay={userJoined} muted={!userJoined || isMuted} style={{ display: 'none' }} />
      )}

      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4 animate-in slide-in-from-right-10 duration-700">
        {micActive && userJoined && !isMuted && (
          <div className="bg-yellow-400 text-black px-5 py-3 rounded-full flex items-center gap-3 shadow-xl border-2 border-yellow-300">
            <Mic size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">DJ Mic Override — Live</span>
          </div>
        )}

        {state?.active && !userJoined && (
          <div className="relative bg-[#6D1B0A] text-white p-8 rounded-[3rem] shadow-2xl border-4 border-white/10 flex flex-col items-center gap-6 max-w-xs animate-bounce">
            <Radio className="h-10 w-10 text-white animate-pulse" />
            <h4 className="text-xl font-black uppercase text-center">{state.djName} ON AIR</h4>
            <Button onClick={handleJoinBroadcast} className="w-full h-16 bg-white text-[#6D1B0A] font-black uppercase rounded-2xl shadow-2xl">
              Tune In Now
            </Button>
          </div>
        )}

        <div
          onClick={state?.active && !userJoined ? handleJoinBroadcast : undefined}
          className={cn(
            'bg-white h-20 pl-3 pr-8 rounded-full shadow-3xl flex items-center gap-5 border-2 transition-all',
            state?.active && !userJoined ? 'cursor-pointer scale-105' : 'cursor-default'
          )}
        >
          <div className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl',
            micActive && userJoined && !isMuted ? 'bg-yellow-400' : (state?.isPlaying && userJoined && !isMuted ? 'bg-accent' : 'bg-slate-400')
          )}>
            {micActive && userJoined && !isMuted ? <Mic size={24} className="text-black animate-pulse" /> : <Music size={24} />}
          </div>

          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Campus Signal</p>
            <p className="text-[13px] font-black text-primary uppercase truncate max-w-[150px]">
              {isMuted ? 'TERMINAL MUTED' : (micActive ? 'DJ MIC — LIVE' : (state?.isPlaying ? `${state.djName} ACTIVE` : 'SIGNAL PAUSED'))}
            </p>
          </div>

          {userJoined && (
            <button onClick={handleToggleMute} className={cn('h-12 w-12 rounded-full flex items-center justify-center border-2', isMuted ? 'text-red-500 bg-red-50' : 'text-primary')}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
