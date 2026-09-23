'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase/config';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
    Radio, Music, Mic, MicOff, MessageSquare, Clock, X, Zap, Globe, 
    Pause, Play, Loader2, Headphones, Activity
} from 'lucide-react';
import { 
    getBroadcastStateAction, 
    updateBroadcastStateAction, 
    clearTemporaryAnnouncementAction 
} from '@/app/actions/dbActions';
import { BroadcastState } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ─── YouTube Helpers ──────────────────────────────────────────────────────────

const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    try {
        if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split(/[?&#]/)[0] ?? null;
        if (url.includes('youtube.com/watch')) return new URLSearchParams(url.split('?')[1] ?? '').get('v');
        if (url.includes('youtube.com/embed/')) return url.split('youtube.com/embed/')[1]?.split(/[?&#]/)[0] ?? null;
    } catch { return null; }
    return null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
        autoplay: '1', mute: '0', controls: '1',
        enablejsapi: '1', origin, rel: '0', modestbranding: '1',
    }).toString()}`;
};

const isYouTubeUrl = (url: string) => url.includes('youtube.com') || url.includes('youtu.be');

// ─── Component ────────────────────────────────────────────────────────────────

export default function DJBroadcastDashboard({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const [state, setState]           = useState<BroadcastState | null>(null);
    const [loading, setLoading]       = useState(true);
    const [sourceUrl, setSourceUrl]   = useState('');
    const [flashMessage, setFlashMessage] = useState('');
    const [expiryMins, setExpiryMins] = useState('15');
    const [isSaving, setIsSaving]     = useState(false);

    // ── Mic state ──────────────────────────────────────────────────────────
    const [isMicActive, setIsMicActive]     = useState(false);
    const [micPermission, setMicPermission] = useState<'idle' | 'requesting' | 'denied'>('idle');
    const [micLevel, setMicLevel]           = useState(0); // 0–100 for visualizer
    const micStreamRef    = useRef<MediaStream | null>(null);
    const recorderRef     = useRef<MediaRecorder | null>(null);
    const analyserRef     = useRef<AnalyserNode | null>(null);
    const audioCtxRef     = useRef<AudioContext | null>(null);
    const animFrameRef    = useRef<number>(0);
    const chunkSeqRef     = useRef(0);
    const isCapturingRef  = useRef(false);
    const isFirstChunkRef = useRef(true);

    useEffect(() => {
        loadState();
        const interval = setInterval(loadState, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        return () => { stopMic().catch(() => {}); };
    }, []);

    const loadState = async () => {
        try {
            const data = await getBroadcastStateAction();
            if (data) {
                setState(data);
                if (!sourceUrl && data.sourceUrl) setSourceUrl(data.sourceUrl);
            }
        } catch (e) {}
        setLoading(false);
    };

    // ─── Mic visualizer loop ───────────────────────────────────────────────
    const startVisualizer = (stream: MediaStream) => {
        const ACtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx  = new ACtx() as AudioContext;
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setMicLevel(Math.min(100, (avg / 128) * 100));
            animFrameRef.current = requestAnimationFrame(tick);
        };
        tick();
    };

    const stopVisualizer = () => {
        cancelAnimationFrame(animFrameRef.current);
        setMicLevel(0);
        audioCtxRef.current?.close().catch(() => {});
        audioCtxRef.current = null;
    };

    // ─── Stop mic broadcast ────────────────────────────────────────────────
    const stopMic = async () => {
        isCapturingRef.current = false;
        recorderRef.current?.stop();
        micStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        recorderRef.current  = null;
        micStreamRef.current = null;
        stopVisualizer();
        setIsMicActive(false);
        chunkSeqRef.current   = 0;
        isFirstChunkRef.current = true;
        try {
            // Linisin ang Firestore signals
            await deleteDoc(doc(db, 'broadcast', 'micchunk'));
            await deleteDoc(doc(db, 'broadcast', 'micstream'));
            await updateBroadcastStateAction({ micActive: false } as any);
        } catch {}
        toast.info('Mic stream stopped.');
    };

    // ─── Start mic broadcast ───────────────────────────────────────────────
    const handleToggleMic = async () => {
        if (isMicActive) { await stopMic(); return; }

        setMicPermission('requesting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            micStreamRef.current  = stream;
            chunkSeqRef.current   = 0;
            isFirstChunkRef.current = true;
            isCapturingRef.current  = true;
            setMicPermission('idle');

            const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
                .find(t => MediaRecorder.isTypeSupported(t)) ?? '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            recorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size === 0) return;

                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];

                    if (isFirstChunkRef.current) {
                        isFirstChunkRef.current = false;
                        try {
                            await setDoc(doc(db, 'broadcast', 'micstream'), {
                                initSegment: base64,
                                mimeType:    mimeType || 'audio/webm',
                                active:      true,
                                ts:          Date.now(),
                            });
                        } catch (err) {
                            console.error('micstream write failed:', err);
                        }
                    } else {
                        try {
                            await setDoc(doc(db, 'broadcast', 'micchunk'), {
                                data:     base64,
                                ts:       Date.now(),
                                seq:      chunkSeqRef.current++,
                                mimeType: mimeType || 'audio/webm',
                            });
                        } catch (err) {
                            console.error('micchunk write failed:', err);
                        }
                    }
                };
                reader.readAsDataURL(e.data);
            };

            recorder.start(250); // Low latency capture
            startVisualizer(stream);
            setIsMicActive(true);
            await updateBroadcastStateAction({ micActive: true } as any);
            toast.success('Mic stream is live!');
        } catch (err: any) {
            setMicPermission('denied');
            toast.error(err?.name === 'NotAllowedError' ? 'Microphone access denied.' : 'Could not access microphone.');
        }
    };

    // ─── Music broadcast handlers ──────────────────────────────────────────
    const handleBroadcastMusic = async () => {
        if (!sourceUrl.trim()) { toast.error('Please enter a valid URL'); return; }
        setIsSaving(true);
        try {
            await updateBroadcastStateAction({ active: true, sourceUrl: sourceUrl.trim(), isPlaying: true, timestamp: 0, djName: user?.name || 'Admin DJ' });
            toast.success('Broadcast Signal Transmitted!');
        } catch { toast.error('Transmission failed.'); }
        finally { setIsSaving(false); }
    };

    const handleTogglePlayback = async () => {
        if (!state) return;
        try { await updateBroadcastStateAction({ isPlaying: !state.isPlaying }); }
        catch { toast.error('Sync failed'); }
    };

    const handleStopBroadcast = async () => {
        try { await updateBroadcastStateAction({ active: false, isPlaying: false }); toast.info('Broadcast Terminated.'); }
        catch { toast.error('Protocol error'); }
    };

    const handlePostFlashMessage = async () => {
        if (!flashMessage.trim()) return;
        setIsSaving(true);
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiryMins));
            await updateBroadcastStateAction({ announcement: { message: flashMessage.trim(), expiresAt: expiresAt.toISOString() } });
            toast.success('Flash Signal Deployed!');
            setFlashMessage('');
        } catch { toast.error('Signal failure.'); }
        finally { setIsSaving(false); }
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center">
            <Loader2 className="animate-spin text-accent h-12 w-12" />
        </div>
    );

    const embedUrl = state?.sourceUrl ? getYouTubeEmbedUrl(state.sourceUrl) : null;

    return (
        <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col animate-in fade-in duration-500 overflow-hidden">

            <div className="bg-[#6D1B0A] p-6 md:p-10 text-white flex-none shadow-2xl border-b border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center shadow-2xl animate-pulse">
                            <Radio size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black uppercase">DJ BROADCAST HUB</h2>
                            <p className="text-accent font-black uppercase text-[10px] tracking-[0.4em] mt-3">LIVE SIGNAL CONTROL • ON AIR</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center transition-all hover:bg-white/20">
                        <X size={28} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#14343A]/20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">

                    <div className="xl:col-span-7 space-y-10">
                        <Card className="rounded-[3rem] bg-[#14343A] p-10 space-y-10 relative overflow-hidden">
                            <div className="space-y-4 relative z-10">
                                <Label className="text-[10px] font-black uppercase text-accent ml-1">SOURCE URL</Label>
                                <div className="flex gap-3">
                                    <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="YouTube or direct audio URL" className="h-16 bg-white/5 border-none rounded-2xl text-white" />
                                    <Button onClick={handleBroadcastMusic} disabled={isSaving || !sourceUrl.trim()} className="h-16 px-10 bg-accent rounded-2xl uppercase font-black">
                                        Deploy Feed
                                    </Button>
                                </div>
                            </div>

                            {state?.active && (
                                <div className="p-8 bg-white/10 rounded-[2.5rem] flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={cn('h-20 w-20 rounded-full flex items-center justify-center', state.isPlaying ? 'bg-accent' : 'bg-white/10')}>
                                            <Music size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white uppercase truncate max-w-[250px]">{isYouTubeUrl(state.sourceUrl) ? 'YouTube Stream' : 'Audio Feed'}</h4>
                                            <p className="text-[10px] uppercase text-white/50">DJ: {state.djName}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button onClick={handleTogglePlayback} className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-white">
                                            {state.isPlaying ? <Pause size={28} /> : <Play size={28} />}
                                        </button>
                                        <Button onClick={handleStopBroadcast} variant="destructive" className="h-16 px-8 rounded-2xl uppercase font-black">Kill Signal</Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="xl:col-span-5 space-y-10">
                        <div className={cn(
                            'p-10 rounded-[3rem] text-white space-y-6 shadow-2xl relative overflow-hidden transition-colors duration-500',
                            isMicActive ? 'bg-yellow-400' : 'bg-accent'
                        )}>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
                                        <Mic size={24} className={cn(isMicActive && 'text-black animate-pulse')} />
                                    </div>
                                    <h4 className={cn('text-2xl font-black uppercase', isMicActive ? 'text-black' : 'text-white')}>Priority Mic Override</h4>
                                </div>

                                {isMicActive && (
                                    <div className="space-y-2">
                                        <div className="h-3 bg-black/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-black/50 transition-all duration-75" style={{ width: `${micLevel}%` }} />
                                        </div>
                                        <p className="text-[9px] font-black uppercase text-black/50">Broadcasting to all terminals</p>
                                    </div>
                                )}

                                <Button onClick={handleToggleMic} className={cn('w-full h-16 rounded-2xl font-black uppercase border-none', isMicActive ? 'bg-black/20 text-black' : 'bg-white text-accent')}>
                                    {isMicActive ? <><MicOff className="mr-2" /> Stop Voice Stream</> : <><Mic className="mr-2" /> Initialize Voice Stream</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
