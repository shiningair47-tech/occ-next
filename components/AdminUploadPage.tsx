"use client";
import { useState, useEffect } from "react";
import { ScanLine, CircleCheck, PackageOpen, Download, Sparkles, User, CircleAlert, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { parsePaste, ParsedLead } from "@/lib/parsePaste";

interface BatchRow { id: string; label: string; team: string; setter: string; closer: string; source: string; lead_count: number; assigned_date: string; assigned_at: string; uploaded_by: string; origin: string; }
interface TeamInfo { name: string; setter: string; closer: string; status: string; }

const SOURCE_OPTIONS = ["Facebook", "Instagram", "Google Ads", "Referral", "WhatsApp", "TikTok", "Walk-in", "Other"];


const SAMPLE = `Vikram Singh — +91 98765 43210
Anjali Reddy - +91 91234 56789
Karthik Iyer +91 99887 76655
Meera Joshi +91 90011 22334`;

export default function AdminUploadPage() {
  const [pasteText, setPasteText] = useState("");
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [source, setSource] = useState(SOURCE_OPTIONS[0]);
  const [uploadPair, setUploadPair] = useState("");
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [confirmation, setConfirmation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [batchNotes, setBatchNotes] = useState("");

  async function loadData() {
    const res = await fetch("/api/leads?scope=admin_batches");
    if (res.ok) {
      const data = await res.json();
      if (data.batches) setBatches(data.batches);
    }
    const tr = await fetch("/api/teams");
    if (tr.ok) {
      const td = await tr.json();
      const tNames: string[] = td.teams;
      const users: { name: string; role: string; team: string; active: boolean }[] = td.users;
      const tInfo: TeamInfo[] = tNames.map(t => {
        const members = users.filter(u => u.team === t && u.active);
        const setter = members.find(u => u.role === "setter")?.name ?? "";
        const closer = members.find(u => u.role === "closer")?.name ?? "";
        const status = setter && closer ? "complete" : setter || closer ? "partial" : "empty";
        return { name: t, setter, closer, status };
      });
      setTeams(tInfo);
      if (!uploadPair && tInfo.length > 0) setUploadPair(tInfo[0].name);
    }
  }

  useEffect(() => { loadData(); }, []);

  const selectedTeam = teams.find(t => t.name === uploadPair);

  function handleParse() {
    const leads = parsePaste(pasteText);
    setParsedLeads(leads);
    setConfirmation("");
  }

  async function handleConfirm() {
    if (!parsedLeads.length || !uploadPair) return;
    setUploading(true);
    const team = teams.find(t => t.name === uploadPair);
    const now = new Date().toISOString().slice(0, 10);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "upload_batch",
        leads: parsedLeads,
        source,
        notes: batchNotes,
        setter: team?.setter ?? "",
        closer: team?.closer ?? "",
        label: `${uploadPair} · ${source} · ${now}`,
      }),
    });
    setUploading(false);
    if (!res.ok) { toast.error("Upload failed"); return; }
    setConfirmation(`Successfully assigned ${parsedLeads.length} leads to ${uploadPair}.`);
    setParsedLeads([]);
    setPasteText("");
    toast.success("Batch uploaded!");
    await loadData();
  }

  function exportCSV(b: BatchRow) {
    const header = "ID,Label,Team,Setter,Closer,Source,Lead Count,Date\n";
    const row = `${b.id},${b.label},${b.team},${b.setter},${b.closer},${b.source},${b.lead_count},${b.assigned_date}`;
    const blob = new Blob([header + row], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${b.label.replace(/[^a-z0-9]/gi, "_")}.csv`; a.click();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Lead Upload</h2>
        <p className="text-sm text-neutral-500 mt-1">Paste leads in any format. We&apos;ll detect names and numbers automatically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Left: paste */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400">PASTE LEADS</p>
            <button onClick={() => { setPasteText(SAMPLE); setParsedLeads([]); setConfirmation(""); }}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] font-semibold text-gold-dark hover:text-[#1a1a1a] transition-colors">
              <Sparkles className="h-3 w-3" /><span>Load sample</span>
            </button>
          </div>
          <textarea value={pasteText} onChange={e => { setPasteText(e.target.value); setParsedLeads([]); setConfirmation(""); }}
            placeholder={`Aditya Bansal — +91 98101 20011\nPooja Iyer - +91 99001 23344\n+91 91234 88990`}
            className="w-full h-56 px-4 py-3 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] font-mono leading-relaxed focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none" />
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleParse}
              className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#1a1a1a] text-gold text-sm font-semibold border border-gold/40 hover:bg-[#2a2a2a] transition-colors">
              <ScanLine className="h-4 w-4" /><span>Parse Leads</span>
            </button>
            <button onClick={() => { setPasteText(""); setParsedLeads([]); setConfirmation(""); }}
              className="px-4 py-2.5 rounded-md bg-white text-neutral-600 text-sm font-medium border border-neutral-200 hover:border-neutral-400 transition-colors">
              Clear
            </button>
          </div>
        </div>

        {/* Right: options */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">SOURCE TAG</p>
            <div className="relative">
              <select value={source} onChange={e => setSource(e.target.value)}
                className="appearance-none w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                {SOURCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">ASSIGN TO PAIR</p>
            {teams.length > 0 ? (
              <div className="relative">
                <select value={uploadPair} onChange={e => setUploadPair(e.target.value)}
                  className="appearance-none w-full px-3.5 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30">
                  {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>
                <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-amber-200 bg-amber-50">
                <CircleAlert className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                <p className="text-[11px] text-amber-900 font-medium">No teams exist. Create one in Teams first.</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">PAIR MEMBERS</p>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-white border border-neutral-200 rounded-md">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-500">Setter</span>
                </div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{selectedTeam?.setter || <span className="text-neutral-400 italic text-sm font-normal">Unassigned</span>}</p>
              </div>
              <div className="flex-1 p-3 bg-white border border-neutral-200 rounded-md">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-gold" />
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-500">Closer</span>
                </div>
                <p className="text-sm font-semibold text-[#1a1a1a]">{selectedTeam?.closer || <span className="text-neutral-400 italic text-sm font-normal">Unassigned</span>}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            {selectedTeam?.status === "complete" ? (
              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                <CircleCheck className="h-3.5 w-3.5 text-emerald-700" />
                <p className="text-[11px] text-emerald-800 leading-relaxed">Pair is complete — leads will route to both members.</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <CircleAlert className="h-3.5 w-3.5 text-amber-700" />
                <p className="text-[11px] text-amber-800 leading-relaxed">This pair is incomplete. Register a setter and a closer in Users before uploading.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      {parsedLeads.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Preview</h3>
              <p className="text-xs text-neutral-500 mt-0.5">{parsedLeads.length} leads ready for assignment</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">BATCH NOTES (OPTIONAL)</p>
              <textarea value={batchNotes} onChange={e => setBatchNotes(e.target.value)}
                placeholder="Add notes that will carry over to every lead in this batch"
                className="w-full px-3 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none h-20" />
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.25em] text-neutral-400 mb-2">BATCH NOTES (OPTIONAL)</p>
              <textarea value={batchNotes} onChange={e => setBatchNotes(e.target.value)}
                placeholder="Add notes that will carry over to every lead in this batch"
                className="w-full px-3 py-2.5 rounded-md border border-neutral-200 bg-white text-sm text-[#1a1a1a] placeholder-neutral-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none h-20" />
            </div>
            <button onClick={handleConfirm} disabled={uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60">
              <CircleCheck className="h-4 w-4" /><span>{uploading ? "Uploading…" : "Confirm & Assign"}</span>
            </button>
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-[#faf8f3] border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">Phone</th>
                </tr>
              </thead>
              <tbody>
                {parsedLeads.map((l, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="px-4 py-3 text-xs text-neutral-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1a1a1a]">{l.name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700 font-mono">{l.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="mt-2 mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CircleCheck className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-900">{confirmation}</p>
        </div>
      )}

      {/* Recent batches */}
      <div className="mt-10">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#1a1a1a] tracking-tight font-['Adorn_Condensed','Halis','Inter',sans-serif]">Recent Batches</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{batches.length} total · grouped by team and assigned date</p>
        </div>
        {batches.length > 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-[#faf8f3] border-b border-neutral-200">
                  {["Batch","Team","Setter / Closer","Source","Leads","Assigned","CSV"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id} className="border-b border-neutral-100 hover:bg-[#faf8f3] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-[#1a1a1a]">{b.label}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">by {b.uploaded_by} · {b.origin}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-700 font-medium">{b.team}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[#1a1a1a]">{b.setter}</p>
                      <p className="text-[10px] text-neutral-500">{b.closer}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{b.source}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#1a1a1a]">{b.lead_count}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-mono font-semibold text-[#1a1a1a]">{b.assigned_date}</p>
                      <p className="text-[10px] text-neutral-400">{b.assigned_at?.slice(0,16)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => exportCSV(b)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white text-neutral-700 border border-neutral-200 hover:border-gold hover:text-[#1a1a1a] text-[10px] font-semibold transition-colors">
                        <Download className="h-3 w-3" /><span>Export</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-neutral-200 rounded-lg p-12 flex flex-col items-center">
            <PackageOpen className="h-10 w-10 text-neutral-300 mb-3" />
            <p className="text-sm font-medium text-neutral-500 text-center">No batches uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}




