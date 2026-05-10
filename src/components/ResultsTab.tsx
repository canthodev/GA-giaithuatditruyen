import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting, Room, ScheduleRun, ScheduledMeeting, Participant } from '../lib/supabase';
import { slotToLabel, DAYS } from '../lib/ga';
import { exportScheduleExcel } from '../lib/exportExcel';
import { Trophy, CalendarDays, AlertCircle, RefreshCw, Loader2, TrendingUp, CheckCircle2, FileSpreadsheet } from 'lucide-react';

type GenerationData = { generation: number; best_fitness: number; avg_fitness: number };

const PAD = { top: 24, right: 24, bottom: 48, left: 52 };

function ConvergenceChart({ data }: { data: GenerationData[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; gen: number; best: number; avg: number } | null>(null);
  const W = 800;
  const H = 260;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxFitness = 100;
  const minFitness = Math.max(0, Math.floor(Math.min(...data.map(d => d.avg_fitness)) / 10) * 10 - 10);
  const fitnessRange = maxFitness - minFitness;

  const xOf = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const yOf = (v: number) => PAD.top + chartH - ((v - minFitness) / fitnessRange) * chartH;

  const bestPts  = data.map((d, i) => `${xOf(i)},${yOf(d.best_fitness)}`).join(' ');
  const avgPts   = data.map((d, i) => `${xOf(i)},${yOf(d.avg_fitness)}`).join(' ');
  const areaPath = data.map((d, i) => `${xOf(i)},${yOf(d.best_fitness)}`).join(' ')
    + ` ${xOf(data.length - 1)},${PAD.top + chartH} ${PAD.left},${PAD.top + chartH}`;

  const yTicks = Array.from({ length: 6 }, (_, i) => minFitness + (fitnessRange / 5) * i);
  const xTickStep = Math.max(1, Math.floor(data.length / 6));
  const xTicks = data
    .map((d, i) => ({ i, gen: d.generation }))
    .filter(({ i }) => i === 0 || i === data.length - 1 || i % xTickStep === 0);

  const last = data[data.length - 1];
  const first = data[0];
  const improvement = last.best_fitness - first.best_fitness;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 pb-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 leading-none">Quá Trình Hội Tụ</h2>
            <p className="text-xs text-slate-400 mt-0.5">{data.length} thế hệ — Fitness theo thời gian tiến hóa</p>
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="text-center">
            <div className="font-bold text-blue-600 text-lg leading-none">{last.best_fitness.toFixed(1)}</div>
            <div className="text-slate-400 mt-0.5">Fitness cuối</div>
          </div>
          <div className="text-center">
            <div className={`font-bold text-lg leading-none ${improvement >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}
            </div>
            <div className="text-slate-400 mt-0.5">Cải thiện</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-slate-700 text-lg leading-none">{last.avg_fitness.toFixed(1)}</div>
            <div className="text-slate-400 mt-0.5">TB cuối</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 bg-blue-500 rounded" />
          <span className="text-slate-500">Best fitness</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
          <span className="text-slate-500">Avg fitness</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="cgBestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>
            <clipPath id="cgClip">
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Y grid lines + labels */}
          {yTicks.map(v => (
            <g key={v}>
              <line
                x1={PAD.left} y1={yOf(v)} x2={PAD.left + chartW} y2={yOf(v)}
                stroke="#e2e8f0" strokeWidth="1"
              />
              <text x={PAD.left - 8} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
                {v.toFixed(0)}
              </text>
            </g>
          ))}

          {/* X grid lines + labels */}
          {xTicks.map(({ i, gen }) => (
            <g key={i}>
              <line
                x1={xOf(i)} y1={PAD.top} x2={xOf(i)} y2={PAD.top + chartH}
                stroke="#f1f5f9" strokeWidth="1"
              />
              <text x={xOf(i)} y={PAD.top + chartH + 16} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {gen}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#cbd5e1" strokeWidth="1" />

          {/* Axis labels */}
          <text x={PAD.left + chartW / 2} y={H - 2} textAnchor="middle" fontSize="11" fill="#64748b">Thế hệ</text>
          <text
            x={14} y={PAD.top + chartH / 2}
            textAnchor="middle" fontSize="11" fill="#64748b"
            transform={`rotate(-90, 14, ${PAD.top + chartH / 2})`}
          >Fitness</text>

          {/* Area fill under best */}
          <polygon points={areaPath} fill="url(#cgBestGrad)" clipPath="url(#cgClip)" />

          {/* Avg line (dashed) */}
          <polyline
            points={avgPts}
            fill="none" stroke="#94a3b8" strokeWidth="1.5"
            strokeDasharray="5 4" strokeLinejoin="round"
            clipPath="url(#cgClip)"
          />

          {/* Best line */}
          <polyline
            points={bestPts}
            fill="none" stroke="#3b82f6" strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round"
            clipPath="url(#cgClip)"
          />

          {/* Final point highlight */}
          <circle cx={xOf(data.length - 1)} cy={yOf(last.best_fitness)} r="5" fill="#3b82f6" />
          <circle cx={xOf(data.length - 1)} cy={yOf(last.best_fitness)} r="9" fill="#3b82f6" fillOpacity="0.15" />

          {/* Invisible hit areas for tooltip */}
          {data.map((d, i) => (
            <rect
              key={i}
              x={xOf(i) - (chartW / data.length) / 2}
              y={PAD.top}
              width={chartW / data.length}
              height={chartH}
              fill="transparent"
              onMouseEnter={e => {
                const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                setTooltip({
                  x: xOf(i),
                  y: yOf(d.best_fitness),
                  gen: d.generation,
                  best: d.best_fitness,
                  avg: d.avg_fitness,
                });
              }}
            />
          ))}

          {/* Tooltip */}
          {tooltip && (() => {
            const tx = Math.min(tooltip.x + 12, W - 130);
            const ty = Math.max(tooltip.y - 60, PAD.top);
            return (
              <g>
                <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#3b82f6" />
                <rect x={tx} y={ty} width="120" height="58" rx="6" fill="#1e293b" opacity="0.92" />
                <text x={tx + 10} y={ty + 16} fontSize="11" fill="#94a3b8">Thế hệ {tooltip.gen}</text>
                <text x={tx + 10} y={ty + 32} fontSize="12" fill="#60a5fa" fontWeight="600">Best: {tooltip.best.toFixed(2)}</text>
                <text x={tx + 10} y={ty + 48} fontSize="12" fill="#94a3b8">Avg:  {tooltip.avg.toFixed(2)}</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

type FullScheduledMeeting = ScheduledMeeting & {
  meeting: Meeting;
  room: Room;
};

type Props = {
  latestRunId: string | null;
};

const ROOM_COLORS = [
  { bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300'   },
  { bg: 'bg-emerald-100',text: 'text-emerald-800', border: 'border-emerald-300'},
  { bg: 'bg-amber-100',  text: 'text-amber-800',   border: 'border-amber-300'  },
  { bg: 'bg-rose-100',   text: 'text-rose-800',    border: 'border-rose-300'   },
  { bg: 'bg-teal-100',   text: 'text-teal-800',    border: 'border-teal-300'   },
];

export default function ResultsTab({ latestRunId }: Props) {
  const [runs, setRuns] = useState<ScheduleRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<ScheduleRun | null>(null);
  const [scheduledMeetings, setScheduledMeetings] = useState<FullScheduledMeeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadRuns();
    loadRooms();
    loadParticipants();
  }, []);

  useEffect(() => {
    if (latestRunId) {
      loadRuns().then(() => {
        setSelectedRunId(latestRunId);
      });
    }
  }, [latestRunId]);

  useEffect(() => {
    if (selectedRunId) loadRunDetail(selectedRunId);
  }, [selectedRunId]);

  async function loadRooms() {
    const { data } = await supabase.from('rooms').select('*');
    if (data) setRooms(data as Room[]);
  }

  async function loadParticipants() {
    const { data } = await supabase.from('participants').select('*');
    if (data) setParticipants(data as Participant[]);
  }

  async function handleExportExcel() {
    if (!selectedRun) return;
    setExporting(true);
    try {
      exportScheduleExcel(scheduledMeetings, participants, selectedRun.run_name);
    } finally {
      setExporting(false);
    }
  }

  async function loadRuns() {
    const { data } = await supabase.from('schedule_runs').select('*').order('created_at', { ascending: false });
    if (data) {
      setRuns(data as ScheduleRun[]);
      if (!selectedRunId && data.length > 0) {
        setSelectedRunId(data[0].id);
      }
    }
  }

  async function loadRunDetail(runId: string) {
    setLoading(true);
    const [{ data: runData }, { data: smData }] = await Promise.all([
      supabase.from('schedule_runs').select('*').eq('id', runId).maybeSingle(),
      supabase.from('scheduled_meetings').select('*, meeting:meetings(*), room:rooms(*)').eq('schedule_run_id', runId),
    ]);
    if (runData) setSelectedRun(runData as ScheduleRun);
    if (smData) setScheduledMeetings(smData as unknown as FullScheduledMeeting[]);
    setLoading(false);
  }

  // Build calendar grid: days x time slots, each slot holds all meetings that occupy it
  const calendarGrid = DAYS.map((day, dayIdx) => {
    const dayStart = dayIdx * 8;
    // slots[slotIdx] = list of meetings that START at that slot
    const startSlots: FullScheduledMeeting[][] = Array.from({ length: 8 }, () => []);
    // occupied[slotIdx] = set of meetings covering that slot (including multi-slot spans)
    const occupied: Set<string>[] = Array.from({ length: 8 }, () => new Set());
    scheduledMeetings.forEach(sm => {
      if (sm.time_slot >= dayStart && sm.time_slot < dayStart + 8) {
        const slotIdx = sm.time_slot - dayStart;
        startSlots[slotIdx].push(sm);
        for (let s = 0; s < sm.meeting.duration_slots && slotIdx + s < 8; s++) {
          occupied[slotIdx + s].add(sm.id);
        }
      }
    });
    return { day, startSlots, occupied };
  });

  const roomColorMap: Record<string, typeof ROOM_COLORS[0]> = {};
  rooms.forEach((r, i) => {
    roomColorMap[r.id] = ROOM_COLORS[i % ROOM_COLORS.length];
  });

  const totalConflicts = scheduledMeetings.reduce((s, sm) => s + sm.conflicts, 0);
  const noConflicts = totalConflicts === 0;

  const slotTimeLabels = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  if (!selectedRun && runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Trophy className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Chưa có kết quả</h2>
        <p className="text-slate-500 text-sm max-w-sm">
          Chuyển sang tab "Chạy GA", tạo dữ liệu mẫu và chạy giải thuật để xem kết quả tại đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Kết Quả Xếp Lịch</h1>
          <p className="text-slate-500 text-sm mt-0.5">Lịch họp tối ưu do GA tạo ra</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedRunId ?? ''}
            onChange={e => setSelectedRunId(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {runs.map(r => (
              <option key={r.id} value={r.id}>
                {r.run_name} — {r.final_fitness.toFixed(1)} điểm
              </option>
            ))}
          </select>
          <button
            onClick={loadRuns}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
          {selectedRun && scheduledMeetings.length > 0 && (
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
            >
              {exporting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xuất...</>
                : <><FileSpreadsheet className="w-4 h-4" /> Xuất Excel</>
              }
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-3" />
          <span className="text-slate-500">Đang tải kết quả...</span>
        </div>
      ) : selectedRun ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-md shadow-blue-200">
              <div className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Fitness Score</div>
              <div className="text-3xl font-bold">{selectedRun.final_fitness.toFixed(1)}</div>
              <div className="text-blue-200 text-xs mt-1">/ 100 điểm tối đa</div>
            </div>
            <div className={`rounded-2xl p-5 shadow-sm ${noConflicts ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-800'}`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${noConflicts ? 'text-emerald-100' : 'text-slate-500'}`}>Xung Đột</div>
              <div className="text-3xl font-bold">{totalConflicts}</div>
              <div className={`text-xs mt-1 ${noConflicts ? 'text-emerald-100' : 'text-red-500'}`}>{noConflicts ? 'Không có xung đột!' : 'xung đột còn lại'}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Số Thế Hệ</div>
              <div className="text-3xl font-bold text-slate-800">{selectedRun.generations_data.length}</div>
              <div className="text-slate-400 text-xs mt-1">thế hệ đã chạy</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Cuộc Họp</div>
              <div className="text-3xl font-bold text-slate-800">{scheduledMeetings.length}</div>
              <div className="text-slate-400 text-xs mt-1">đã được xếp lịch</div>
            </div>
          </div>

          {/* Fitness convergence chart */}
          {selectedRun.generations_data.length > 0 && (
            <ConvergenceChart data={selectedRun.generations_data} />
          )}

          {/* Room Legend */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phòng:</span>
            {rooms.map(r => {
              const c = roomColorMap[r.id];
              return (
                <span key={r.id} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c?.bg} ${c?.text} ${c?.border}`}>
                  <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                  {r.name}
                </span>
              );
            })}
          </div>

          {/* Calendar View */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-800">Lịch Họp Trong Tuần (Xem Dạng Lịch)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-16 border-b border-slate-200">Giờ</th>
                    {DAYS.map(d => (
                      <th key={d} className="px-3 py-2.5 text-center font-semibold text-slate-700 border-b border-l border-slate-200">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slotTimeLabels.map((time, slotIdx) => (
                    <tr key={slotIdx} className={slotIdx === 7 ? 'border-b-2 border-slate-300' : ''}>
                      <td className="px-3 py-2 font-mono text-slate-400 border-b border-slate-100 align-top whitespace-nowrap">{time}</td>
                      {calendarGrid.map(({ day, startSlots, occupied }) => {
                        const starters = startSlots[slotIdx];
                        const continuedIds = occupied[slotIdx];
                        // meetings that are spanning but didn't start this slot
                        const continued = [...continuedIds]
                          .map(id => scheduledMeetings.find(x => x.id === id))
                          .filter((sm): sm is FullScheduledMeeting =>
                            !!sm && sm.time_slot % 8 !== slotIdx
                          );
                        return (
                          <td key={day} className="px-1 py-1 border-b border-l border-slate-100 align-top min-w-28">
                            <div className="flex flex-col gap-1">
                              {starters.map(sm => {
                                const c = roomColorMap[sm.room_id];
                                return (
                                  <div key={sm.id} className={`rounded-lg px-2 py-1.5 border ${c?.bg} ${c?.border} cursor-default`}>
                                    <div className={`font-semibold ${c?.text} leading-tight truncate`} title={sm.meeting.title}>
                                      {sm.meeting.title}
                                    </div>
                                    <div className="text-slate-500 text-[10px] mt-0.5 truncate">{sm.room.name}</div>
                                    {sm.meeting.duration_slots > 1 && (
                                      <div className="text-slate-400 text-[10px]">{sm.meeting.duration_slots * 30} phút</div>
                                    )}
                                    {sm.conflicts > 0 && (
                                      <AlertCircle className="w-3 h-3 text-red-500 mt-0.5" />
                                    )}
                                  </div>
                                );
                              })}
                              {continued.map(sm => {
                                const c = roomColorMap[sm.room_id];
                                return (
                                  <div key={sm.id} className={`rounded-b-lg px-2 py-1 border-x border-b ${c?.bg} ${c?.border} opacity-60`}>
                                    <div className="text-[10px] text-slate-400 italic truncate">{sm.meeting.title} (tiếp...)</div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Chi Tiết Từng Cuộc Họp</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {scheduledMeetings
                .slice()
                .sort((a, b) => a.time_slot - b.time_slot)
                .map(sm => {
                  const { day, time } = slotToLabel(sm.time_slot);
                  const c = roomColorMap[sm.room_id];
                  const endSlotIdx = (sm.time_slot % 8) + sm.meeting.duration_slots - 1;
                  const endTime = slotTimeLabels[endSlotIdx] ?? '?';
                  return (
                    <div key={sm.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`mt-1.5 w-3 h-3 rounded-full flex-shrink-0 ${c?.bg?.replace('-100', '-400')}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">{sm.meeting.title}</span>
                          {sm.meeting.priority >= 4 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                              Ưu tiên cao
                            </span>
                          )}
                          {sm.conflicts === 0 ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-red-500">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {sm.conflicts} xung đột
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                          <span>📅 {day}</span>
                          <span>⏰ {time} – {endTime}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c?.bg} ${c?.text} ${c?.border}`}>{sm.room.name}</span>
                        </div>
                        {sm.meeting.participant_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {sm.meeting.participant_ids.map(pid => {
                              const p = participants.find(x => x.id === pid);
                              if (!p) return null;
                              return (
                                <span key={pid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                  <span className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-[10px] flex-shrink-0">
                                    {p.name.charAt(0).toUpperCase()}
                                  </span>
                                  {p.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
