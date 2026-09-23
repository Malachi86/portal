"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Monitor,
  GraduationCap,
  School
} from "lucide-react";

import {
  getSettingsAction,
  updateSettingsAction,
  getRoomsAction,
  addRoomAction,
  updateRoomAction,
  deleteRoomAction,
  getLabsAction,
  addLabAction,
  updateLabAction,
  deleteLabAction,
} from "@/app/actions/dbActions";

import { Room, Lab } from "@/utils/storage";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [teacherCode, setTeacherCode] = useState("");
  const [programs, setPrograms] = useState<string[]>([]);
  const [strands, setStrands] = useState<string[]>([]);
  const [newProgram, setNewProgram] = useState("");
  const [newStrand, setNewStrand] = useState("");

  const [rooms, setRooms] = useState<Room[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [roomDelete, setRoomDelete] = useState<Room | null>(null);

  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [labDelete, setLabDelete] = useState<Lab | null>(null);

  const [roomName, setRoomName] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");

  const [labName, setLabName] = useState("");
  const [labCapacity, setLabCapacity] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const settings = await getSettingsAction();
      setTeacherCode(settings.teacherSecret || "");
      setPrograms(settings.programs || ['BSCS', 'BSIT', 'BSCpE', 'BSHM', 'BSTM']);
      setStrands(settings.strands || ['STEM', 'ABM', 'HUMSS', 'ICT', 'HE']);

      const [roomsData, labsData] = await Promise.all([
        getRoomsAction(),
        getLabsAction(),
      ]);

      setRooms(roomsData);
      setLabs(labsData);
    } catch {
      toast.error("Failed to load settings");
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    try {
      await updateSettingsAction({ 
        teacherSecret: teacherCode,
        programs,
        strands
      });
      toast.success("System configurations deployed");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const addProgram = () => {
    if (newProgram && !programs.includes(newProgram)) {
      setPrograms([...programs, newProgram]);
      setNewProgram("");
    }
  };

  const addStrand = () => {
    if (newStrand && !strands.includes(newStrand)) {
      setStrands([...strands, newStrand]);
      setNewStrand("");
    }
  };

  /* -------------------------------
     ROOM FUNCTIONS
  --------------------------------*/

  const openRoomDialog = (room: Room | null) => {
    setEditingRoom(room);
    setRoomName(room?.name || "");
    setRoomCapacity(room?.capacity?.toString() || "");
    setRoomDialogOpen(true);
  };

  const saveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !roomCapacity) {
      toast.error("Room name and capacity required");
      return;
    }
    try {
      if (editingRoom) {
        await updateRoomAction(editingRoom.id, { name: roomName, capacity: Number(roomCapacity) });
        toast.success("Room updated");
      } else {
        await addRoomAction({ id: `ROOM-${Date.now()}`, name: roomName, capacity: Number(roomCapacity) });
        toast.success("Room created");
      }
      setRoomDialogOpen(false);
      loadData();
    } catch {
      toast.error("Failed to save room");
    }
  };

  const deleteRoom = async () => {
    if (!roomDelete) return;
    await deleteRoomAction(roomDelete.id);
    toast.success("Room deleted");
    setRoomDelete(null);
    loadData();
  };

  /* -------------------------------
     LAB FUNCTIONS
  --------------------------------*/

  const openLabDialog = (lab: Lab | null) => {
    setEditingLab(lab);
    setLabName(lab?.name || "");
    setLabCapacity(lab?.capacity?.toString() || "");
    setLabDialogOpen(true);
  };

  const saveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labName || !labCapacity) {
      toast.error("Lab name and capacity required");
      return;
    }
    try {
      if (editingLab) {
        await updateLabAction(editingLab.id, { name: labName, capacity: Number(labCapacity) });
        toast.success("Lab updated");
      } else {
        await addLabAction({ id: `LAB-${Date.now()}`, name: labName, capacity: Number(labCapacity) });
        toast.success("Lab created with PCs");
      }
      setLabDialogOpen(false);
      loadData();
    } catch {
      toast.error("Failed to save lab");
    }
  };

  const deleteLab = async () => {
    if (!labDelete) return;
    await deleteLabAction(labDelete.id);
    toast.success("Lab deleted");
    setLabDelete(null);
    loadData();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-10 max-w-6xl pb-32">
      <div>
        <h2 className="text-4xl font-black text-primary uppercase tracking-tighter">System Console</h2>
        <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Registry & Facilities Configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ACADEMIC OFFERINGS */}
        <Card className="p-10 rounded-[3rem] border-none shadow-2xl space-y-8">
          <div className="flex items-center gap-4 text-primary">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><School size={24} /></div>
            <h3 className="font-black uppercase tracking-tight text-xl">Academic Programs</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">College Programs</Label>
              <div className="flex gap-2">
                <Input placeholder="New Program Code" value={newProgram} onChange={e => setNewProgram(e.target.value)} className="h-12 rounded-xl" />
                <Button onClick={addProgram} size="icon" className="h-12 w-12 rounded-xl"><Plus size={20} /></Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {programs.map(p => (
                  <Badge key={p} className="h-10 px-4 bg-muted text-foreground font-bold rounded-xl flex items-center gap-2 group">
                    {p}
                    <XCircle size={14} className="cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => setPrograms(programs.filter(x => x !== p))} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SHS Strands</Label>
              <div className="flex gap-2">
                <Input placeholder="New Strand Code" value={newStrand} onChange={e => setNewStrand(e.target.value)} className="h-12 rounded-xl" />
                <Button onClick={addStrand} size="icon" className="h-12 w-12 rounded-xl"><Plus size={20} /></Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {strands.map(s => (
                  <Badge key={s} className="h-10 px-4 bg-muted text-foreground font-bold rounded-xl flex items-center gap-2 group">
                    {s}
                    <XCircle size={14} className="cursor-pointer text-muted-foreground hover:text-red-500" onClick={() => setStrands(strands.filter(x => x !== s))} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* SECURITY & DEPLOY */}
        <Card className="p-10 rounded-[3rem] border-none shadow-2xl space-y-8 bg-primary text-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center"><Settings size={24} /></div>
            <h3 className="font-black uppercase tracking-tight text-xl">Faculty Protocol</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-1">Instructor Auth Code</Label>
              <Input type="password" value={teacherCode} onChange={e => setTeacherCode(e.target.value)} className="h-16 rounded-2xl bg-white/10 border-none text-white font-black text-xl px-8" />
            </div>
            <Button onClick={saveSettings} className="w-full h-16 bg-white text-primary hover:bg-white/90 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl gap-3">
              <Save size={20} /> Deploy Configuration
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <SectionCard title="Lecture Rooms" icon={<Building2 />} onAdd={() => openRoomDialog(null)}>
          {rooms.map(room => (
            <ItemRow key={room.id} name={room.name} subtitle={`Capacity: ${room.capacity}`} onEdit={() => openRoomDialog(room)} onDelete={() => setRoomDelete(room)} />
          ))}
        </SectionCard>

        <SectionCard title="Laboratories" icon={<Monitor />} onAdd={() => openLabDialog(null)}>
          {labs.map(lab => (
            <ItemRow key={lab.id} name={lab.name} subtitle={`PC Capacity: ${lab.capacity}`} onEdit={() => openLabDialog(lab)} onDelete={() => setLabDelete(lab)} />
          ))}
        </SectionCard>
      </div>

      <ConfirmDialog open={!!roomDelete} title="Purge Facility" description={`Terminate records for ${roomDelete?.name}?`} onCancel={() => setRoomDelete(null)} onConfirm={deleteRoom} />
      <ConfirmDialog open={!!labDelete} title="Purge Lab" description={`Terminate records for ${labDelete?.name} and all PCs?`} onCancel={() => setLabDelete(null)} onConfirm={deleteLab} />

      <FormDialog open={roomDialogOpen} title={editingRoom ? "Edit Room" : "Register Room"} name={roomName} capacity={roomCapacity} setName={setRoomName} setCapacity={setRoomCapacity} onSave={saveRoom} onClose={() => setRoomDialogOpen(false)} />
      <FormDialog open={labDialogOpen} title={editingLab ? "Edit Lab" : "Register Lab"} name={labName} capacity={labCapacity} setName={setLabName} setCapacity={setLabCapacity} onSave={saveLab} onClose={() => setLabDialogOpen(false)} />
    </div>
  );
}

function SectionCard({ title, icon, children, onAdd }: any) {
  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-primary/5 space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4 text-primary">
          <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center">{icon}</div>
          <h3 className="font-black uppercase text-xl tracking-tight">{title}</h3>
        </div>
        <Button onClick={onAdd} size="icon" className="rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-white"><Plus size={20} /></Button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ItemRow({ name, subtitle, onEdit, onDelete }: any) {
  return (
    <div className="flex justify-between items-center bg-muted/10 p-6 rounded-2xl border border-transparent hover:border-primary/10 transition-colors">
      <div>
        <p className="font-black text-foreground uppercase text-sm">{name}</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{subtitle}</p>
      </div>
      <div className="flex gap-2">
        <Button size="icon" variant="ghost" onClick={onEdit} className="h-10 w-10 rounded-full text-muted-foreground hover:bg-white shadow-sm"><Pencil size={14} /></Button>
        <Button size="icon" variant="ghost" onClick={onDelete} className="h-10 w-10 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 shadow-sm"><Trash2 size={14} /></Button>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, description, onCancel, onConfirm }: any) {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent className="rounded-[2.5rem] p-10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black text-primary uppercase">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base font-bold text-muted-foreground mt-4">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-8 gap-2">
          <AlertDialogCancel className="h-12 rounded-xl font-black uppercase text-[10px]">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="h-12 rounded-xl bg-primary text-white font-black uppercase text-[10px]">Terminate</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FormDialog({ open, title, name, capacity, setName, setCapacity, onSave, onClose }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-[2.5rem] p-10">
        <form onSubmit={onSave}>
          <DialogHeader><DialogTitle className="text-2xl font-black text-primary uppercase">{title}</DialogTitle></DialogHeader>
          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identification</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-14 rounded-2xl font-bold px-6" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Capacity</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="h-14 rounded-2xl font-bold px-6" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="ghost" className="h-14 rounded-2xl font-black uppercase text-xs">Abort</Button></DialogClose>
            <Button type="submit" className="h-14 rounded-2xl bg-primary text-white font-black uppercase text-xs px-8">Save Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function XCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-x">
      <path d="m15 9-6 6"/><path d="m9 9 6 6"/><circle cx="12" cy="12" r="10"/>
    </svg>
  );
}
