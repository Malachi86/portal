'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateClassworkAction, deleteClassworkAction, getEnrollmentsAction, getUsersAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Loader2, Save, Calendar, Clock, Plus, Trash2, Link as LinkIcon, X, UserCheck, Mail, ListChecks, FileText, CheckCircle2 } from 'lucide-react';
import { Classwork, QuizQuestion, User } from '@/utils/storage';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface EditClassworkDialogProps {
  classwork: Classwork;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditClassworkDialog({ classwork, onClose, onUpdated }: EditClassworkDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(classwork.title);
  const [description, setDescription] = useState(classwork.description || '');
  
  const [datePart, timePart] = classwork.dueDate.split('T');
  const [dueDateDate, setDueDateDate] = useState(datePart || '');
  const [dueDateTime, setDueDateTime] = useState(timePart || '23:59');
  
  const [totalPoints, setTotalPoints] = useState(classwork.totalPoints?.toString() || '100');
  const [type, setType] = useState<'quiz' | 'activity' | 'performance' | 'final_output'>(classwork.type);
  const [submissionType, setSubmissionType] = useState<'file' | 'quiz'>(classwork.submissionType);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>(classwork.questions || []);
  const [links, setLinks] = useState<{ name: string, url: string }[]>(classwork.attachments || []);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [exemptedIds, setExemptedIds] = useState<string[]>(classwork.exemptedStudentIds || []);
  const [notifyStudents, setNotifyStudents] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollments, users] = await Promise.all([
          getEnrollmentsAction(),
          getUsersAction()
        ]);
        
        const enrolled = enrollments
          .filter(e => e.subjectId === classwork.subjectId && e.status === 'approved')
          .map(e => users.find(u => u.id === e.studentId))
          .filter((u): u is User => !!u);
        setEnrolledStudents(enrolled);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, [classwork.subjectId]);

  const addLink = () => {
    if (!newLinkName || !newLinkUrl) return;
    setLinks([...links, { name: newLinkName, url: newLinkUrl }]);
    setNewLinkName('');
    setNewLinkUrl('');
  };

  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: `Q-${Date.now()}-${questions.length}`,
      text: '',
      type: 'mcq',
      points: 5,
      options: ['', '', '', ''],
      correctAnswer: ''
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const toggleExempted = (id: string) => {
    setExemptedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !dueDateDate) {
      toast.error("Title and Deadline are required.");
      return;
    }

    setLoading(true);
    try {
      const dueDate = `${dueDateDate}T${dueDateTime}`;
      const calculatedTotalPoints = submissionType === 'quiz' ? questions.reduce((sum, q) => sum + Number(q.points), 0) : Number(totalPoints);

      const updates: any = {
        title,
        description,
        dueDate,
        totalPoints: calculatedTotalPoints,
        type,
        submissionType,
        exemptedStudentIds: exemptedIds,
        attachments: links,
      };

      if (submissionType === 'quiz') {
        updates.questions = questions;
      } else {
        updates.questions = [];
      }

      await updateClassworkAction(classwork.id, updates);
      toast.success("Assessment updated!");
      onUpdated();
    } catch (err) {
      toast.error("Failed to update assessment.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this assessment?")) return;
    setLoading(true);
    try {
      await deleteClassworkAction(classwork.id);
      toast.success("Assessment deleted.");
      onUpdated();
    } catch (err) {
      toast.error("Failed to delete assessment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-3xl flex flex-col h-[90vh] bg-white">
        {/* Condensed Header */}
        <div className="px-8 py-4 flex-none flex items-center justify-between border-b border-slate-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Modify Classwork</DialogTitle>
          </DialogHeader>
          <Button variant="ghost" onClick={handleDelete} className="h-9 w-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm">
             <Trash2 size={18} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 space-y-6 bg-slate-50/10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Title</Label>
                <Input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required 
                  className="h-11 rounded-xl border-slate-100 bg-white px-5 font-bold focus:ring-primary/10" 
                />
              </div>

              <div className="p-5 bg-muted/5 rounded-[1.5rem] border border-slate-100 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Assessment Category</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-white font-black uppercase text-[9px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="activity" className="font-bold">Activity</SelectItem>
                      <SelectItem value="quiz" className="font-bold">Quiz</SelectItem>
                      <SelectItem value="performance" className="font-bold">Performance Task</SelectItem>
                      <SelectItem value="final_output" className="font-bold">Final Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Submission Interface</Label>
                  <Select value={submissionType} onValueChange={(v: any) => setSubmissionType(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-100 bg-white font-black uppercase text-[9px] tracking-widest"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="file" className="font-bold">Cloud Link Repository</SelectItem>
                      <SelectItem value="quiz" className="font-bold">Interactive Architecture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-muted/10 rounded-[2rem] flex flex-col justify-center items-center text-center space-y-5 border border-slate-200/50 shadow-inner">
              <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-lg border border-slate-100">
                <Calendar size={24} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/40">Temporal Deadline</p>
                <div className="flex items-center gap-2 pt-1">
                  <Input type="date" value={dueDateDate} onChange={e => setDueDateDate(e.target.value)} required className="h-10 rounded-xl border-slate-100 bg-white text-[10px] font-black text-center w-32 shadow-sm" />
                  <Input type="time" value={dueDateTime} onChange={e => setDueDateTime(e.target.value)} required className="h-10 rounded-xl border-slate-100 bg-white text-[10px] font-black text-center w-24 shadow-sm" />
                </div>
              </div>
              <div className="w-full pt-3 border-t border-slate-200/50">
                 <Label className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Point Matrix</Label>
                 <Input 
                   type="number" 
                   value={totalPoints} 
                   onChange={e => setTotalPoints(e.target.value)} 
                   disabled={submissionType === 'quiz'}
                   className="h-11 mt-1 bg-white border-none rounded-xl text-center font-black text-2xl shadow-sm text-primary" 
                 />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instructional Logic</Label>
            <Textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="rounded-2xl p-5 border-slate-100 bg-white min-h-[100px] font-medium text-xs shadow-inner resize-none" 
            />
          </div>

          {submissionType === 'quiz' && (
            <div className="space-y-6 pt-6 border-t border-slate-200/50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                    <ListChecks size={18} />
                  </div>
                  <h3 className="font-black uppercase tracking-tighter text-xl text-slate-900">Quiz Architecture</h3>
                </div>
                <Button 
                  type="button" 
                  onClick={addQuestion} 
                  variant="outline" 
                  className="h-10 rounded-full px-6 font-black uppercase text-[9px] tracking-widest gap-2 border-2 border-slate-200 hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={14} /> Add Question
                </Button>
              </div>

              <div className="space-y-6">
                {questions.length === 0 ? (
                   <div className="p-16 text-center border-4 border-dashed rounded-[2.5rem] border-slate-100 bg-white/50">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">No questions defined</p>
                   </div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id} className="p-6 md:p-8 bg-muted/10 rounded-[2.5rem] space-y-6 relative group border border-transparent hover:border-primary/5 transition-all">
                       <button onClick={() => removeQuestion(q.id)} className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg z-10"><Trash2 size={14}/></button>
                       
                       <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-[#6D1B0A] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg">{idx + 1}</div>
                          
                          <div className="flex-1 w-full relative">
                            <Select value={q.type} onValueChange={(v: any) => updateQuestion(q.id, { type: v })}>
                               <SelectTrigger className="h-10 w-full rounded-full border-2 border-[#6D1B0A]/20 bg-white font-black text-[10px] uppercase tracking-widest px-6 focus:ring-0 focus:border-[#6D1B0A]"><SelectValue /></SelectTrigger>
                               <SelectContent className="rounded-xl font-bold">
                                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                                  <SelectItem value="tf">True / False</SelectItem>
                                  <SelectItem value="identification">Identification</SelectItem>
                                  <SelectItem value="enumeration">Enumeration</SelectItem>
                                  <SelectItem value="explanation">Explanation</SelectItem>
                               </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border-2 border-slate-100 shrink-0">
                             <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Points:</Label>
                             <input 
                               type="number" 
                               value={q.points} 
                               onChange={e => updateQuestion(q.id, { points: Number(e.target.value) })} 
                               className="w-12 bg-transparent border-none text-center font-black text-base text-[#6D1B0A] outline-none" 
                             />
                          </div>
                       </div>

                       <div className="space-y-4">
                          <Input 
                            placeholder="Enter question text..." 
                            value={q.text} 
                            onChange={e => updateQuestion(q.id, { text: e.target.value })} 
                            className="h-12 border-none font-bold bg-white text-sm rounded-xl px-6 shadow-sm placeholder:text-slate-300" 
                          />

                          {q.type === 'mcq' && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {q.options?.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex gap-2 items-center group/opt">
                                     <Input 
                                       placeholder={`Option ${optIdx + 1}`} 
                                       value={opt} 
                                       onChange={e => {
                                         const newOpts = [...(q.options || [])];
                                         newOpts[optIdx] = e.target.value;
                                         updateQuestion(q.id, { options: newOpts });
                                       }} 
                                       className="h-11 rounded-xl border-none font-medium bg-white text-xs px-5 shadow-sm focus:ring-1 focus:ring-primary/20" 
                                     />
                                     <button 
                                       type="button"
                                       onClick={() => updateQuestion(q.id, { correctAnswer: opt })}
                                       className={cn(
                                         "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                         q.correctAnswer === opt && opt !== "" 
                                          ? "bg-green-500 text-white scale-105" 
                                          : "bg-white text-slate-300 hover:text-green-500"
                                       )}
                                     >
                                       <CheckCircle2 size={20} />
                                     </button>
                                  </div>
                                ))}
                             </div>
                          )}

                          {q.type === 'tf' && (
                             <div className="flex gap-3 pt-2">
                                {['True', 'False'].map(opt => (
                                  <button 
                                    key={opt} 
                                    type="button" 
                                    onClick={() => updateQuestion(q.id, { correctAnswer: opt })} 
                                    className={cn(
                                      "h-11 px-6 rounded-xl border-2 font-black text-xs tracking-widest transition-all flex-1 active:scale-[0.98]", 
                                      q.correctAnswer === opt 
                                        ? "bg-green-500 border-green-500 text-white shadow-lg" 
                                        : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                                    )}
                                  >
                                    {opt.toUpperCase()}
                                  </button>
                                ))}
                             </div>
                          )}

                          {(q.type === 'identification' || q.type === 'enumeration') && (
                             <div className="pt-2">
                                <Label className="text-[8px] font-black uppercase tracking-widest text-green-600 ml-1">Registry Key (Correct Answer)</Label>
                                <Input 
                                  placeholder={q.type === 'enumeration' ? "Item 1, Item 2, Item 3" : "Mandatory Validation String"} 
                                  value={q.correctAnswer} 
                                  onChange={e => updateQuestion(q.id, { correctAnswer: e.target.value })} 
                                  className="h-11 mt-1 border-2 border-green-100 bg-white font-black text-xs uppercase rounded-xl px-6 focus:border-green-500 transition-all" 
                                />
                             </div>
                          )}
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {submissionType === 'file' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 ml-1">
                  <LinkIcon size={14} className="text-primary" />
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Supporting Assets</Label>
                </div>
                <div className="space-y-3">
                   <div className="flex gap-2">
                      <Input placeholder="Label" value={newLinkName} onChange={e => setNewLinkName(e.target.value)} className="h-10 rounded-xl bg-white border-slate-100 font-bold text-[10px]" />
                      <Input placeholder="Asset URL" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} className="h-10 rounded-xl bg-white border-slate-100 font-bold text-[10px] flex-[2]" />
                      <Button type="button" onClick={addLink} className="h-10 w-10 rounded-xl shrink-0 p-0 shadow-md"><Plus size={18} /></Button>
                   </div>
                   <div className="space-y-2">
                      {links.map((l, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-[9px] font-black uppercase truncate flex-1">{l.name}</span>
                          <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-between ml-1">
                <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-primary" />
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Exemption Matrix</Label>
                </div>
                <Badge className="bg-blue-600 text-white font-black text-[8px] uppercase tracking-widest border-none px-3 py-1 rounded-full shadow-md">{exemptedIds.length} MARKED</Badge>
              </div>
              <div className="p-3 bg-muted/5 rounded-[1.5rem] border border-slate-100 max-h-[150px] overflow-y-auto no-scrollbar grid grid-cols-1 gap-2 shadow-inner">
                 {enrolledStudents.map(s => (
                   <div key={s.id} onClick={() => toggleExempted(s.id)} className={cn("flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer", exemptedIds.includes(s.id) ? "bg-primary/5 border-primary text-primary shadow-sm" : "bg-white border-slate-50")}>
                      <div className={cn("h-4 w-4 rounded border flex items-center justify-center transition-colors", exemptedIds.includes(s.id) ? "bg-primary border-primary text-white" : "border-slate-300")}><X size={10} className={cn(exemptedIds.includes(s.id) ? "block" : "hidden")} /></div>
                      <span className="text-[9px] font-black uppercase truncate">{s.name}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Condensed Optimized Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex-none flex items-center justify-between px-8 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
               <Checkbox id="notify-edit" checked={notifyStudents} onCheckedChange={(v) => setNotifyStudents(!!v)} className="h-5 w-5 border-primary rounded-md" />
               <label htmlFor="notify-edit" className="flex items-center gap-2 font-black uppercase text-[9px] tracking-widest text-slate-500 cursor-pointer hover:text-primary transition-colors">
                  <Mail size={14} /> Send Email Blast
               </label>
            </div>
            <div className="flex items-center gap-5">
               <DialogClose asChild>
                 <button className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 hover:text-red-500 transition-colors">Abort</button>
               </DialogClose>
               <Button onClick={handleSubmit} disabled={loading} className="h-11 px-12 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl transition-all active:scale-95 gap-3">
                 {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />} Save Changes
               </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
