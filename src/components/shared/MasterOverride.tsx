'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    getSubjectsAction, 
    getUsersAction, 
    getEnrollmentsAction, 
    getClassworksAction, 
    getSubmissionsAction,
    getAttendancesAction,
    updateSubmissionAction,
    addSubmissionAction,
    updateAttendanceAction,
    addAttendanceAction,
    deleteAttendanceAction
} from '@/app/actions/dbActions';
import { Subject, User, Classwork, Submission, Attendance, Enrollment } from '@/utils/storage';
import { 
    ShieldAlert, 
    X, 
    Loader2, 
    CheckCircle2, 
    Database, 
    ClipboardList,
    Calendar,
    RefreshCw,
    Plus,
    UserCheck,
    Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function MasterOverride() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [classworks, setClassworks] = useState<Classwork[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);

    // Selection States
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    // Controlled UI States for Scores
    const [localGrades, setLocalGrades] = useState<Record<string, string>>({});

    // Injection States
    const [injectDate, setInjectDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [injectStatus, setInjectStatus] = useState<'present' | 'late' | 'absent'>('present');

    // --- SECRET CODE LISTENER ---
    useEffect(() => {
        let inputBuffer = '';
        const secretCode = 'edit';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            
            inputBuffer += e.key.toLowerCase();
            if (inputBuffer.includes(secretCode)) {
                setIsOpen(true);
                inputBuffer = '';
                loadRegistry();
            }
            if (inputBuffer.length > 10) inputBuffer = inputBuffer.slice(-5);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const loadRegistry = async () => {
        setLoading(true);
        try {
            const [subj, usrs, enr, cws, subs, att] = await Promise.all([
                getSubjectsAction(),
                getUsersAction(),
                getEnrollmentsAction(),
                getClassworksAction(),
                getSubmissionsAction(),
                getAttendancesAction()
            ]);
            setSubjects(subj);
            setUsers(usrs.filter(u => u.role === 'student'));
            setEnrollments(enr);
            setClassworks(cws);
            setSubmissions(subs);
            setAttendances(att);
        } catch (e) {
            toast.error("Registry Sync Failed.");
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!selectedSubjectId) return [];
        const enrolledIds = enrollments
            .filter(e => e.subjectId === selectedSubjectId && e.status === 'approved')
            .map(e => e.studentId);
        return users.filter(u => enrolledIds.includes(u.id));
    }, [selectedSubjectId, enrollments, users]);

    const targetClassworks = useMemo(() => {
        return classworks.filter(cw => cw.subjectId === selectedSubjectId && cw.status === 'published');
    }, [selectedSubjectId, classworks]);

    const targetAttendance = useMemo(() => {
        return attendances
            .filter(a => a.subjectId === selectedSubjectId && a.studentId === selectedStudentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedSubjectId, selectedStudentId, attendances]);

    // REAL-TIME SYNC OF CONTROLLED INPUTS
    useEffect(() => {
        const newLocalGrades: Record<string, string> = {};
        targetClassworks.forEach(cw => {
            const isExempted = cw.exemptedStudentIds?.includes(selectedStudentId);
            if (isExempted) {
                newLocalGrades[cw.id] = cw.totalPoints.toString();
            } else {
                const sub = submissions.find(s => s.classworkId === cw.id && s.studentId === selectedStudentId);
                newLocalGrades[cw.id] = sub?.grade !== undefined ? sub.grade.toString() : '0';
            }
        });
        setLocalGrades(newLocalGrades);
    }, [selectedStudentId, submissions, targetClassworks]);

    const handleGradeOverride = async (cwId: string, score: string) => {
        if (!selectedStudentId) return;
        const val = parseFloat(score);
        if (isNaN(val)) return;

        const existing = submissions.find(s => s.classworkId === cwId && s.studentId === selectedStudentId);
        
        try {
            if (existing) {
                await updateSubmissionAction(existing.id, { grade: val, status: 'graded' });
                setSubmissions(prev => prev.map(s => s.id === existing.id ? { ...s, grade: val, status: 'graded' } : s));
            } else {
                const newSub = await addSubmissionAction({
                    classworkId: cwId,
                    studentId: selectedStudentId,
                    grade: val,
                    status: 'graded',
                    submittedAt: new Date().toISOString()
                });
                setSubmissions(prev => [...prev, newSub]);
            }
            toast.success("Score Injected.");
        } catch (e) {
            toast.error("Mutation failed.");
        }
    };

    const handleAttendanceOverride = async (attId: string, status: 'present' | 'late' | 'absent') => {
        try {
            await updateAttendanceAction(attId, { status });
            setAttendances(prev => prev.map(a => a.id === attId ? { ...a, status } : a));
            toast.success(`Marked as ${status.toUpperCase()}`);
        } catch (e) {
            toast.error("Status update failed.");
        }
    };

    const handleDeleteAttendance = async (attId: string) => {
        if (!confirm("Are you sure you want to permanently delete this attendance record?")) return;
        try {
            await deleteAttendanceAction(attId);
            setAttendances(prev => prev.filter(a => a.id !== attId));
            toast.success("Record purged from registry.");
        } catch (e) {
            toast.error("Purge protocol failed.");
        }
    };

    const handleInjectAttendance = async () => {
        if (!selectedSubjectId || !selectedStudentId || !injectDate) {
            toast.error("Missing selection or date.");
            return;
        }

        setLoading(true);
        try {
            const timeIn = injectStatus !== 'absent' ? new Date().toLocaleTimeString('en-US', { hour12: false }) : undefined;
            const newRecord = {
                studentId: selectedStudentId,
                subjectId: selectedSubjectId,
                date: new Date(injectDate).toISOString(),
                status: injectStatus,
                timeIn: timeIn,
                sessionId: `MANUAL-${Date.now()}`
            };

            await addAttendanceAction(newRecord);
            toast.success("New record injected.");
            await loadRegistry();
        } catch (e) {
            toast.error("Injection failed.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none !p-0 border-none flex flex-col !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none z-[200] bg-white overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Registry Master Override Portal</DialogTitle>
                    <DialogDescription>Administrative interface for manual data manipulation.</DialogDescription>
                </DialogHeader>

                <div className="bg-[#6D1B0A] p-6 md:p-10 text-white flex-none shadow-2xl relative z-[210]">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-[1.25rem] bg-white/10 backdrop-blur-xl border-2 border-white/20 flex items-center justify-center shadow-2xl rotate-3">
                                <ShieldAlert size={32} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">REGISTRY MASTER OVERRIDE</h2>
                                <p className="text-white/60 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">DIRECT DATABASE MANIPULATION • AUTHORIZED ACCESS ONLY</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={loadRegistry} 
                                disabled={loading}
                                className="h-14 px-6 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center gap-2 transition-all font-black uppercase text-[10px] tracking-widest"
                            >
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                                Sync Registry
                            </button>
                            <button onClick={() => setIsOpen(false)} className="h-14 w-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                                <X size={28} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-[#F4F7F8] border-b border-slate-200 p-6 md:p-8 flex-none shadow-md relative z-[205]">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">TARGET ACADEMIC SUBJECT</Label>
                            <select 
                                value={selectedSubjectId}
                                onChange={e => { setSelectedSubjectId(e.target.value); setSelectedStudentId(''); }}
                                className="w-full h-16 bg-white border-2 border-primary/10 rounded-2xl px-8 font-black text-sm uppercase tracking-tight focus:border-primary transition-all shadow-xl appearance-none outline-none"
                            >
                                <option value="">SELECT COURSE LOAD</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code || 'NA'})</option>)}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">TARGET STUDENT IDENTITY</Label>
                            <select 
                                value={selectedStudentId}
                                onChange={e => setSelectedStudentId(e.target.value)}
                                disabled={!selectedSubjectId}
                                className="w-full h-16 bg-white border-2 border-primary/10 rounded-2xl px-8 font-black text-sm uppercase tracking-tight focus:border-primary transition-all shadow-xl appearance-none cursor-pointer outline-none disabled:opacity-50"
                            >
                                <option value="">SELECT IDENTITY</option>
                                {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name} - {s.id}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 bg-slate-50/30">
                    <div className="max-w-7xl mx-auto">
                        {!selectedSubjectId || !selectedStudentId ? (
                            <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-8 opacity-20">
                                <Database size={120} className="text-primary" />
                                <h3 className="text-3xl font-black uppercase tracking-widest">Waiting for selection...</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 animate-in fade-in duration-500">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 ml-2">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ClipboardList size={20} /></div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Academic Records Override</h3>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {targetClassworks.length === 0 ? (
                                            <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center text-muted-foreground font-bold uppercase text-xs">No assessments published</div>
                                        ) : (
                                            targetClassworks.map(cw => {
                                                const isExempted = cw.exemptedStudentIds?.includes(selectedStudentId);
                                                const currentVal = localGrades[cw.id] || '0';

                                                return (
                                                    <div key={cw.id} className={cn(
                                                        "bg-white rounded-[2rem] border-none shadow-lg overflow-hidden group hover:shadow-2xl transition-all p-8 flex flex-col md:flex-row md:items-center justify-between gap-6",
                                                        isExempted && "ring-2 ring-blue-500/20"
                                                    )}>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase tracking-widest">{cw.type.replace('_', ' ')}</Badge>
                                                                {isExempted && (
                                                                    <Badge className="bg-blue-500 text-white border-none font-black text-[8px] uppercase tracking-widest gap-1">
                                                                        <UserCheck size={10} /> EXEMPTED
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <h4 className="font-black text-lg uppercase truncate pr-4 text-slate-800">{cw.title}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">MAX POINTS: {cw.totalPoints}</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl shadow-inner border border-slate-100">
                                                            <Label className="text-[9px] font-black uppercase text-primary">SCORE</Label>
                                                            <input 
                                                                type="number"
                                                                value={currentVal}
                                                                disabled={isExempted}
                                                                onChange={(e) => setLocalGrades(prev => ({ ...prev, [cw.id]: e.target.value }))}
                                                                onBlur={(e) => handleGradeOverride(cw.id, e.target.value)}
                                                                className={cn(
                                                                    "w-20 border-2 rounded-xl h-12 text-center font-black text-xl focus:border-primary outline-none transition-all",
                                                                    isExempted ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-white border-primary/10 text-primary"
                                                                )}
                                                            />
                                                            <span className="text-slate-300 font-bold">/ {cw.totalPoints}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 ml-2">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Calendar size={20} /></div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Attendance Log Manipulation</h3>
                                    </div>

                                    <div className="p-8 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2.5rem] space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Plus size={16} className="text-primary" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Manual Injection</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Input type="date" value={injectDate} onChange={e => setInjectDate(e.target.value)} className="h-12 rounded-xl border-primary/10 bg-white" />
                                            <select value={injectStatus} onChange={e => setInjectStatus(e.target.value as any)} className="h-12 rounded-xl border-primary/10 bg-white px-4 font-bold text-xs uppercase tracking-widest">
                                                <option value="present">PRESENT</option>
                                                <option value="late">LATE</option>
                                                <option value="absent">ABSENT</option>
                                            </select>
                                        </div>
                                        <Button onClick={handleInjectAttendance} className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg">
                                            Inject Record
                                        </Button>
                                    </div>

                                    <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2 pb-10">
                                        {targetAttendance.length === 0 ? (
                                            <div className="p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center text-muted-foreground font-bold uppercase text-xs">No records found</div>
                                        ) : (
                                            targetAttendance.map(log => (
                                                <div key={log.id} className="bg-white p-6 rounded-[1.5rem] shadow-md border border-slate-100 flex items-center justify-between gap-6 group hover:border-primary/20 transition-all">
                                                    <div className="flex items-center gap-5">
                                                        <div className="text-center min-w-[60px]">
                                                            <p className="text-2xl font-black text-primary leading-none">{format(new Date(log.date), 'dd')}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{format(new Date(log.date), 'MMM')}</p>
                                                        </div>
                                                        <div className="h-10 w-px bg-slate-100" />
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-slate-800 tracking-tight">Time: {log.timeIn || '--:--'}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref: {log.id.slice(-8)}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                            {(['present', 'late', 'absent'] as const).map(status => (
                                                                <button 
                                                                    key={status}
                                                                    onClick={() => handleAttendanceOverride(log.id, status)}
                                                                    className={cn(
                                                                        "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                                                        log.status === status 
                                                                            ? status === 'present' ? "bg-green-500 text-white shadow-lg" : 
                                                                              status === 'late' ? "bg-amber-500 text-white shadow-lg" : 
                                                                              "bg-red-500 text-white shadow-lg"
                                                                            : "text-slate-400 hover:bg-white"
                                                                    )}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteAttendance(log.id)}
                                                            className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group-hover:scale-105 active:scale-95"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#F4F7F8] border-t border-slate-200 p-6 flex-none flex items-center justify-between px-12 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Protocol Active</span>
                    </div>
                    <Button 
                        onClick={() => setIsOpen(false)}
                        className="h-16 px-16 bg-[#6D1B0A] hover:bg-[#521408] text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl shadow-2xl transition-all active:scale-95"
                    >
                        TERMINATE SESSION
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
