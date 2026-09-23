"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Calendar,
  Filter,
  Monitor,
  Building2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import {
  getLabRequestsAction,
  updateLabRequestAction,
  getUsersAction,
  getSubjectsAction,
  getLabsAction,
  addAttendanceAction,
  addAuditLogAction,
} from "@/app/actions/dbActions";

import { LabRequest, User, Subject, Lab } from "@/utils/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function AllRequests() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [reqs, usrs, subs, lbs] = await Promise.all([
        getLabRequestsAction(),
        getUsersAction(),
        getSubjectsAction(),
        getLabsAction(),
      ]);

      setRequests(
        reqs.sort(
          (a, b) =>
            new Date(b.startTime).getTime() -
            new Date(a.startTime).getTime()
        )
      );

      setUsers(usrs);
      setSubjects(subs);
      setLabs(lbs);
    } catch {
      toast.error("Failed to load requests registry.");
    } finally {
      setLoading(false);
    }
  };

  const getName = (id: string, type: "user" | "subject" | "lab") => {
    switch (type) {
      case "user":
        return users.find((u) => u.id === id)?.name || id;
      case "subject":
        return subjects.find((s) => s.id === id)?.name || id;
      case "lab":
        return labs.find((l) => l.id === id)?.name || id;
    }
  };

  const handleUpdateRequest = async (
    request: LabRequest,
    status: "approved" | "declined"
  ) => {
    try {
      await updateLabRequestAction(request.id, { status });
      if (status === "approved") {
        const studentName = getName(request.studentId, "user");
        const labName = getName(request.labId, "lab");
        const usageDetails = `Authorized ${request.requestType === 'handle' ? 'Handle' : 'Use'} for ${labName}${request.pcId ? ` (PC ${request.pcId.split('-').pop()})` : ''}`;
        
        await addAuditLogAction({
          userId: request.studentId,
          userName: studentName,
          action: 'facility_usage',
          details: usageDetails
        });

        await addAttendanceAction({
          studentId: request.studentId,
          studentName: studentName,
          subjectId: request.subjectId,
          date: new Date(request.startTime).toISOString(),
          status: 'present',
          timeIn: new Date(request.startTime).toLocaleTimeString("en-US", { hour12: false }),
          sessionId: `SESS-REQ-${request.id}`,
          locationId: request.labId,
          locationType: "lab",
          pcId: request.pcId,
        });

        toast.success(`Request approved.`);
      } else {
        toast.info("Request declined.");
      }
      loadRequests();
    } catch {
      toast.error("Process execution failed.");
    }
  };

  const filtered = requests.filter((r) => {
    const student = getName(r.studentId, "user").toLowerCase();
    const lab = getName(r.labId, "lab").toLowerCase();

    const searchMatch = student.includes(search.toLowerCase()) || lab.includes(search.toLowerCase());
    const statusMatch = filter === "All" || r.status === filter.toLowerCase();
    const dateMatch = !dateFilter || new Date(r.startTime).toISOString().split("T")[0] === dateFilter;

    return searchMatch && statusMatch && dateMatch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div>
        <h2 className="text-4xl font-black text-primary tracking-tighter leading-none">Requests Registry</h2>
        <p className="text-[10px] font-black text-muted-foreground mt-2 uppercase tracking-widest">Global Terminal Log</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search student or lab..." 
            value={search} 
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            className="h-14 pl-12 rounded-2xl border-primary/5 shadow-lg font-bold" 
          />
        </div>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="h-14 px-6 rounded-2xl border-none bg-white shadow-lg font-black text-[10px] appearance-none outline-none cursor-pointer"
        >
          {["All", "Pending", "Approved", "Declined"].map(f => (
            <option key={f} value={f}>{f} status</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-primary/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 border-b border-primary/5">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black text-muted-foreground">Identity</th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-muted-foreground">Lab / Room</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-muted-foreground">Type</th>
                <th className="px-6 py-6 text-center text-[10px] font-black text-muted-foreground">Time</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-primary" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">No entries detected</td></tr>
              ) : (
                paginated.map((request) => (
                  <tr key={request.id} className="hover:bg-primary/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-black text-foreground tracking-tight leading-none mb-1.5">{getName(request.studentId, "user")}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{request.studentId}</p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        {request.pcId ? <Monitor size={14} className="text-primary/40" /> : <Building2 size={14} className="text-primary/40" />}
                        <span className="font-black text-slate-700 text-xs">{getName(request.labId, "lab")}</span>
                      </div>
                      {request.pcId && <p className="text-[10px] font-bold text-primary">Station: PC {request.pcId.split("-").pop()}</p>}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest bg-muted/50 border-none px-3">
                        {request.requestType === 'handle' ? 'HANDLER' : 'USER'}
                      </Badge>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <p className="text-[10px] font-black text-slate-800">{new Date(request.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Badge className={cn(
                          "px-4 py-1.5 rounded-full font-black text-[9px] border-none shadow-sm",
                          request.status === 'pending' ? "bg-amber-100 text-amber-800" :
                          request.status === 'approved' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                          {request.status}
                        </Badge>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateRequest(request, "approved")} className="h-9 w-9 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center transition-all"><CheckCircle2 size={16} /></button>
                            <button onClick={() => handleUpdateRequest(request, "declined")} className="h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all"><XCircle size={16} /></button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-4">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] bg-white shadow-lg border border-primary/5">Prev</Button>
          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="h-12 px-6 rounded-xl font-black uppercase text-[10px] bg-white shadow-lg border border-primary/5">Next</Button>
        </div>
      )}
    </div>
  );
}