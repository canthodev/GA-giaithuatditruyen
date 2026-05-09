import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Meeting, Room, ScheduleRun, ScheduledMeeting } from '../lib/supabase';
import { slotToLabel, DAYS } from '../lib/ga';
import { Trophy, CalendarDays, AlertCircle, RefreshCw, Loader2, TrendingUp, CheckCircle2 } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRuns();
    loadRooms();
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

  // Build calendar grid: days x time slots
  const calendarGrid = DAYS.map((day, dayIdx) => {
    const dayStart = dayIdx * 8;
    const slots: (FullScheduledMeeting | null)[] = Array(8).fill(null);
    scheduledMeetings.forEach(sm => {
      if (sm.time_slot >= dayStart && sm.time_slot < dayStart + 8) {
        const slotIdx = sm.time_slot - dayStart;
        slots[slotIdx] = sm;
      }
    });
    return { day, slots };
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

          {/* Fitness convergence mini chart */}
          {selectedRun.generations_data.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="font-bold text-slate-800">Quá Trình Hội Tụ</h2>
                <span className="text-xs text-slate-400 ml-auto">
                  {selectedRun.generations_data[0]?.best_fitness.toFixed(1)} → {selectedRun.generations_data[selectedRun.generations_data.length - 1]?.best_fitness.toFixed(1)}{' '}
                  (+{(selectedRun.generations_data[selectedRun.generations_data.length - 1]?.best_fitness - selectedRun.generations_data[0]?.best_fitness).toFixed(1)})
                </span>
              </div>
              <div className="h-24">
                <svg width="100%" height="96" preserveAspectRatio="none" className="overflow-visible">
                  {(() => {
                    const data = selectedRun.generations_data;
                    const areaBottom = data.map((d, i) => {
                      const x = (i / Math.max(data.length - 1, 1)) * 100;
                      const y = 96 - (d.best_fitness / 100) * 96;
                      return `${x}%,${y}`;
                    });
                    const pts = areaBottom.join(' ');
                    const areaPath = `${areaBottom.join(' ')} 100%,96 0%,96`;
                    return (
                      <>
                        <polygon points={areaPath} fill="url(#gradFitness)" opacity="0.3" />
                        <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
                        <defs>
                          <linearGradient id="gradFitness" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>
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
                      {calendarGrid.map(({ day, slots }) => {
                        const sm = slots[slotIdx];
                        const isStart = sm && sm.time_slot % 8 === slotIdx;
                        const isContinued = sm && !isStart;
                        const c = sm ? roomColorMap[sm.room_id] : null;
                        return (
                          <td key={day} className="px-1 py-1 border-b border-l border-slate-100 align-top min-w-28">
                            {sm && isStart ? (
                              <div className={`rounded-lg px-2 py-1.5 border ${c?.bg} ${c?.border} cursor-default`}>
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
                            ) : sm && isContinued ? (
                              <div className={`rounded-b-lg px-2 py-1 border-x border-b ${c?.bg} ${c?.border} opacity-60`}>
                                <div className="text-[10px] text-slate-400 italic">tiếp tục...</div>
                              </div>
                            ) : null}
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
