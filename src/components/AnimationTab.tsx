import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack,
  RefreshCw, Dna, ChevronRight,
  Shuffle, Trophy, GitMerge, Zap,
} from 'lucide-react';
import type { Meeting, Room, Participant } from '../lib/supabase';
import { calcFitness, slotToLabel, DAYS, SLOT_TIMES, SLOTS_PER_DAY } from '../lib/ga';
import type { Gene, Chromosome, Individual } from '../lib/ga';
import { supabase } from '../lib/supabase';

// ─── Mini GA for animation ─────────────────────────────────────────────────────

function ri(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomGene(idx: number, m: Meeting, rooms: Room[]): Gene {
  const valid = rooms.map((r, i) => ({ r, i })).filter(({ r }) => r.capacity >= m.required_capacity);
  const { i: roomIndex } = valid.length > 0 ? valid[ri(0, valid.length - 1)] : { i: 0 };
  const max = 40 - m.duration_slots;
  const day = ri(0, 4);
  const slot = Math.min(day * SLOTS_PER_DAY + ri(0, SLOTS_PER_DAY - m.duration_slots), max);
  return { meetingIndex: idx, roomIndex, timeSlot: slot };
}

function makeChrom(meetings: Meeting[], rooms: Room[]): Chromosome {
  return meetings.map((m, i) => randomGene(i, m, rooms));
}

function tournament(pop: Individual[]): Individual {
  let best = pop[ri(0, pop.length - 1)];
  for (let i = 0; i < 2; i++) {
    const c = pop[ri(0, pop.length - 1)];
    if (c.fitness > best.fitness) best = c;
  }
  return best;
}

function crossoverGenes(
  a: Chromosome, b: Chromosome, rate: number
): [Chromosome, Chromosome, number | null] {
  if (Math.random() > rate || a.length <= 1)
    return [a.map(g => ({ ...g })), b.map(g => ({ ...g })), null];
  const pt = ri(1, a.length - 1);
  return [
    [...a.slice(0, pt).map(g => ({ ...g })), ...b.slice(pt).map(g => ({ ...g }))],
    [...b.slice(0, pt).map(g => ({ ...g })), ...a.slice(pt).map(g => ({ ...g }))],
    pt,
  ];
}

function mutateGenes(
  ch: Chromosome, rate: number, meetings: Meeting[], rooms: Room[]
): [Chromosome, number[]] {
  const idxs: number[] = [];
  const result = ch.map((g, i) => {
    if (Math.random() < rate) { idxs.push(i); return randomGene(g.meetingIndex, meetings[g.meetingIndex], rooms); }
    return { ...g };
  });
  return [result, idxs];
}

// ─── Frame types ───────────────────────────────────────────────────────────────

type Phase = 'init' | 'evaluate' | 'select' | 'crossover' | 'mutate' | 'next_gen';

type Frame = {
  phase: Phase;
  generation: number;
  population: Individual[];
  parentAIdx: number | null;
  parentBIdx: number | null;
  crossoverPoint: number | null;
  mutatedGenes: number[];
  childA: Individual | null;
  childB: Individual | null;
  title: string;
  explanation: string;
  convergence: { gen: number; best: number; avg: number }[];
};

const PHASE_META: Record<Phase, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  init:      { label: 'Khởi Tạo',    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    icon: <Shuffle className="w-4 h-4" /> },
  evaluate:  { label: 'Đánh Giá',    color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   icon: <Trophy className="w-4 h-4" /> },
  select:    { label: 'Chọn Lọc',    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Dna className="w-4 h-4" /> },
  crossover: { label: 'Lai Ghép',    color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',    icon: <GitMerge className="w-4 h-4" /> },
  mutate:    { label: 'Đột Biến',    color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  icon: <Zap className="w-4 h-4" /> },
  next_gen:  { label: 'Thế Hệ Mới', color: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-200',    icon: <ChevronRight className="w-4 h-4" /> },
};

const POP = 8;
const GENS = 15;

function buildFrames(
  meetings: Meeting[], rooms: Room[], participants: Participant[]
): Frame[] {
  const frames: Frame[] = [];
  const convergence: { gen: number; best: number; avg: number }[] = [];

  const score = (ch: Chromosome) => calcFitness(ch, meetings, rooms, participants);
  const ind = (ch: Chromosome): Individual => ({ chromosome: ch, fitness: score(ch) });
  const push = (f: Omit<Frame, 'convergence'>) => frames.push({ ...f, convergence: [...convergence] });

  // Init
  let pop: Individual[] = Array.from({ length: POP }, () => ind(makeChrom(meetings, rooms)));
  push({
    phase: 'init', generation: 1, population: [...pop],
    parentAIdx: null, parentBIdx: null, crossoverPoint: null, mutatedGenes: [], childA: null, childB: null,
    title: 'Bước 1 — Khởi tạo quần thể ngẫu nhiên',
    explanation: `Tạo ${POP} cá thể (chromosome) ngẫu nhiên. Mỗi ô màu trong biểu đồ cột là một cá thể. Chiều cao = điểm fitness. Lịch bên phải hiển thị phương án của cá thể tốt nhất.`,
  });

  for (let gen = 1; gen <= GENS; gen++) {
    // Evaluate
    pop = pop.map(x => ({ chromosome: x.chromosome, fitness: score(x.chromosome) }));
    pop.sort((a, b) => b.fitness - a.fitness);
    const best = pop[0].fitness;
    const avg = pop.reduce((s, x) => s + x.fitness, 0) / pop.length;
    convergence.push({ gen, best: parseFloat(best.toFixed(2)), avg: parseFloat(avg.toFixed(2)) });

    push({
      phase: 'evaluate', generation: gen, population: [...pop],
      parentAIdx: null, parentBIdx: null, crossoverPoint: null, mutatedGenes: [], childA: null, childB: null,
      title: `Thế hệ ${gen} — Đánh giá & sắp xếp theo fitness`,
      explanation: `Tính điểm cho ${POP} cá thể rồi sắp xếp giảm dần. Cột cao nhất (xanh lá) = tốt nhất. Đường đồ thị bên dưới ghi lại fitness tốt nhất và trung bình qua từng thế hệ.`,
    });

    if (gen === GENS) break;

    // Select
    const idxA = ri(0, Math.min(3, pop.length - 1));
    const idxB = ri(0, Math.min(4, pop.length - 1));
    const pA = tournament(pop);
    const pB = tournament(pop);
    const rA = pop.indexOf(pA) >= 0 ? pop.indexOf(pA) : idxA;
    const rB = pop.indexOf(pB) >= 0 ? pop.indexOf(pB) : idxB;

    push({
      phase: 'select', generation: gen, population: [...pop],
      parentAIdx: rA, parentBIdx: rB, crossoverPoint: null, mutatedGenes: [], childA: null, childB: null,
      title: `Thế hệ ${gen} — Chọn lọc (Tournament Selection)`,
      explanation: `Chọn ngẫu nhiên 3 cá thể, lấy cá thể tốt nhất làm "cha" (xanh dương) và "mẹ" (hồng). Cột được tô viền đậm. Cá thể có fitness cao được chọn thường xuyên hơn.`,
    });

    // Crossover
    const [ca, cb, pt] = crossoverGenes(pA.chromosome, pB.chromosome, 0.8);
    const childA = ind(ca);
    const childB = ind(cb);

    push({
      phase: 'crossover', generation: gen, population: [...pop],
      parentAIdx: rA, parentBIdx: rB, crossoverPoint: pt, mutatedGenes: [], childA, childB,
      title: `Thế hệ ${gen} — Lai ghép (Single-Point Crossover)`,
      explanation: pt !== null
        ? `Điểm cắt tại cuộc họp thứ ${pt}. Nửa trái (xanh) từ Cha, nửa phải (hồng) từ Mẹ. Lịch họp bên phải hiển thị 2 con vừa tạo ra.`
        : `Lần này không lai ghép (xác suất 80%). Cha và Mẹ được sao chép trực tiếp thành con.`,
    });

    // Mutate
    const [mA, mutIdxA] = mutateGenes(ca, 0.1, meetings, rooms);
    const [mB, mutIdxB] = mutateGenes(cb, 0.1, meetings, rooms);
    const allMut = [...new Set([...mutIdxA, ...mutIdxB])];
    const mutChildA = ind(mA);
    const mutChildB = ind(mB);

    push({
      phase: 'mutate', generation: gen, population: [...pop],
      parentAIdx: null, parentBIdx: null, crossoverPoint: null, mutatedGenes: allMut, childA: mutChildA, childB: mutChildB,
      title: `Thế hệ ${gen} — Đột biến`,
      explanation: allMut.length > 0
        ? `${allMut.length} cuộc họp bị thay đổi ngẫu nhiên (ô cam nhấp sáng trong lịch con). Giúp thoát khỏi cực trị cục bộ.`
        : `Không có đột biến lần này (10%/gen). Cá thể con giữ nguyên từ lai ghép.`,
    });

    // Next gen
    const nextPop: Individual[] = [
      { chromosome: pop[0].chromosome.map(g => ({ ...g })), fitness: pop[0].fitness },
      { chromosome: pop[1].chromosome.map(g => ({ ...g })), fitness: pop[1].fitness },
      mutChildA, mutChildB,
    ];
    while (nextPop.length < POP) {
      const ch = makeChrom(meetings, rooms);
      nextPop.push(ind(ch));
    }
    nextPop.sort((a, b) => b.fitness - a.fitness);
    pop = nextPop.slice(0, POP);

    push({
      phase: 'next_gen', generation: gen, population: [...pop],
      parentAIdx: null, parentBIdx: null, crossoverPoint: null, mutatedGenes: [], childA: null, childB: null,
      title: `Thế hệ ${gen} → ${gen + 1}: Cập nhật quần thể`,
      explanation: `2 cá thể tốt nhất được giữ lại (tinh hoa, viền vàng). 2 con mới được thêm vào. Phần còn lại được bổ sung ngẫu nhiên. Fitness tốt nhất: ${pop[0].fitness.toFixed(1)}.`,
    });
  }

  return frames;
}

// ─── Chart components ──────────────────────────────────────────────────────────

const ROOM_COLORS = [
  'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-teal-400',
];
const ROOM_LIGHT = [
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-rose-100 text-rose-800 border-rose-300',
  'bg-teal-100 text-teal-800 border-teal-300',
];

/** Bar chart: fitness per individual */
function FitnessBarChart({
  population, parentAIdx, parentBIdx, phase,
}: {
  population: Individual[];
  parentAIdx: number | null;
  parentBIdx: number | null;
  phase: Phase;
}) {
  const maxF = 100;
  return (
    <div className="flex items-end gap-1.5 h-48 px-2 pb-2 pt-4 relative">
      {/* Y gridlines */}
      {[25, 50, 75, 100].map(v => (
        <div
          key={v}
          className="absolute left-0 right-0 border-t border-slate-100 text-[9px] text-slate-400"
          style={{ bottom: `${(v / maxF) * 100}%` }}
        >
          <span className="absolute -top-3 left-1">{v}</span>
        </div>
      ))}

      {population.map((ind, i) => {
        const h = Math.max(2, (ind.fitness / maxF) * 100);
        const isParentA = parentAIdx === i;
        const isParentB = parentBIdx === i;
        const isElite = i < 2 && (phase === 'next_gen' || phase === 'evaluate');
        const isSelected = isParentA || isParentB;

        let barColor = 'bg-slate-300';
        if (i === 0) barColor = 'bg-emerald-500';
        else if (i === 1) barColor = 'bg-emerald-400';
        else if (ind.fitness >= 40) barColor = 'bg-blue-400';
        else if (ind.fitness >= 20) barColor = 'bg-amber-400';
        else barColor = 'bg-red-400';

        if (isParentA) barColor = 'bg-blue-500';
        if (isParentB) barColor = 'bg-rose-500';

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            {/* Value label */}
            <span className={`text-[9px] font-bold ${
              isParentA ? 'text-blue-600' : isParentB ? 'text-rose-600' : 'text-slate-500'
            }`}>
              {ind.fitness.toFixed(0)}
            </span>

            {/* Bar */}
            <div className="w-full flex justify-center">
              <div
                className={`w-full max-w-[36px] rounded-t-md transition-all duration-700 ease-out relative ${barColor} ${
                  isSelected ? 'ring-2 ring-offset-1 ' + (isParentA ? 'ring-blue-500' : 'ring-rose-500') : ''
                } ${isElite && !isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                style={{ height: `${h}%` }}
              >
                {/* Parent label */}
                {isParentA && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-blue-600 whitespace-nowrap">Cha</span>
                )}
                {isParentB && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-rose-600 whitespace-nowrap">Mẹ</span>
                )}
                {isElite && !isSelected && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-500 whitespace-nowrap">★</span>
                )}
              </div>
            </div>

            {/* Index */}
            <span className="text-[9px] text-slate-400">#{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Convergence line chart */
function ConvergenceChart({
  data, currentGen,
}: {
  data: { gen: number; best: number; avg: number }[];
  currentGen: number;
}) {
  const W = 400;
  const H = 80;
  if (data.length < 2) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-slate-400">
        Đồ thị hiện sau thế hệ đầu tiên...
      </div>
    );
  }
  const maxGen = GENS;
  const xOf = (gen: number) => 32 + ((gen - 1) / (maxGen - 1)) * (W - 40);
  const yOf = (v: number) => H - (v / 100) * H;

  const bestPts = data.map(d => `${xOf(d.gen)},${yOf(d.best)}`).join(' ');
  const avgPts  = data.map(d => `${xOf(d.gen)},${yOf(d.avg)}`).join(' ');

  // Area under best line
  const areaPath = [
    ...data.map(d => `${xOf(d.gen)},${yOf(d.best)}`),
    `${xOf(data[data.length - 1].gen)},${H}`,
    `${xOf(data[0].gen)},${H}`,
  ].join(' ');

  const curIdx = data.findIndex(d => d.gen === currentGen);
  const curPt = curIdx >= 0 ? data[curIdx] : null;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 20}`} className="overflow-visible">
      {/* Grid */}
      {[0, 25, 50, 75, 100].map(v => (
        <g key={v}>
          <line x1="32" y1={yOf(v)} x2={W} y2={yOf(v)} stroke="#f1f5f9" strokeWidth="1" />
          <text x="28" y={yOf(v) + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{v}</text>
        </g>
      ))}
      {/* X axis labels */}
      {[1, 5, 10, 15].map(g => (
        <text key={g} x={xOf(g)} y={H + 14} textAnchor="middle" fontSize="8" fill="#94a3b8">G{g}</text>
      ))}

      {/* Area */}
      <polygon points={areaPath} fill="#3b82f6" opacity="0.08" />

      {/* Avg line */}
      <polyline points={avgPts} fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

      {/* Best line */}
      <polyline points={bestPts} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Current gen dot */}
      {curPt && (
        <>
          <line x1={xOf(curPt.gen)} y1="0" x2={xOf(curPt.gen)} y2={H} stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
          <circle cx={xOf(curPt.gen)} cy={yOf(curPt.best)} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
          <circle cx={xOf(curPt.gen)} cy={yOf(curPt.avg)} r="3" fill="#14b8a6" stroke="white" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

/** Calendar grid for a single chromosome */
function ScheduleCalendar({
  chromosome, meetings, rooms, mutatedGenes, crossoverPoint, childMode,
}: {
  chromosome: Chromosome;
  meetings: Meeting[];
  rooms: Room[];
  mutatedGenes?: number[];
  crossoverPoint?: number | null;
  childMode?: 'A' | 'B';
}) {
  // Build grid: day x slot
  type Cell = { geneIdx: number; meetingIdx: number; roomIdx: number; span: number; isMutated: boolean; isCrossed: boolean } | null;
  const grid: Cell[][] = Array.from({ length: 5 }, () => Array(8).fill(null));

  chromosome.forEach((gene, gi) => {
    const meeting = meetings[gene.meetingIndex];
    if (!meeting) return;
    const day = Math.floor(gene.timeSlot / SLOTS_PER_DAY);
    const slotInDay = gene.timeSlot % SLOTS_PER_DAY;
    if (day < 0 || day > 4 || slotInDay < 0 || slotInDay + meeting.duration_slots > 8) return;
    const isMutated = (mutatedGenes ?? []).includes(gi);
    const isCrossed = crossoverPoint !== null && crossoverPoint !== undefined && gi >= crossoverPoint;
    for (let s = 0; s < meeting.duration_slots; s++) {
      if (slotInDay + s < 8) {
        grid[day][slotInDay + s] = {
          geneIdx: gi, meetingIdx: gene.meetingIndex, roomIdx: gene.roomIndex,
          span: meeting.duration_slots,
          isMutated, isCrossed,
        };
      }
    }
  });

  const shortDay = ['T2', 'T3', 'T4', 'T5', 'T6'];
  const shortTime = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30'];

  // Track which rows are already rendered (for span)
  const rendered = Array.from({ length: 5 }, () => Array(8).fill(false));

  return (
    <div className="overflow-auto">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr>
            <th className="w-10 text-slate-400 font-normal py-1 border-b border-slate-100" />
            {shortDay.map(d => (
              <th key={d} className="text-center font-semibold text-slate-600 py-1 border-b border-slate-100 px-0.5">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shortTime.map((t, si) => (
            <tr key={si}>
              <td className="text-slate-400 py-0.5 pr-1 font-mono text-right whitespace-nowrap border-b border-slate-50">{t}</td>
              {[0, 1, 2, 3, 4].map(di => {
                const cell = grid[di][si];
                if (rendered[di][si]) return null;
                if (!cell) {
                  return <td key={di} className="border border-slate-50 bg-slate-50/40 py-0.5 px-0.5 min-w-[36px]" />;
                }
                // Mark spanned rows
                for (let s = 0; s < cell.span; s++) {
                  if (si + s < 8) rendered[di][si + s] = true;
                }
                const roomColor = ROOM_COLORS[cell.roomIdx % ROOM_COLORS.length];
                const meeting = meetings[cell.meetingIdx];
                const mutated = cell.isMutated;
                const crossed = cell.isCrossed;

                return (
                  <td
                    key={di}
                    rowSpan={cell.span}
                    className={`border px-1 py-0.5 align-top min-w-[36px] relative transition-all ${
                      mutated
                        ? 'bg-orange-100 border-orange-400 ring-1 ring-orange-300'
                        : crossed && childMode === 'A'
                          ? 'bg-rose-50 border-rose-300'
                          : crossed && childMode === 'B'
                            ? 'bg-blue-50 border-blue-300'
                            : 'border-slate-200'
                    }`}
                  >
                    <div className={`w-full h-full rounded flex flex-col justify-start gap-0.5 p-0.5 ${
                      mutated
                        ? 'bg-orange-200'
                        : crossed && childMode === 'A'
                          ? 'bg-rose-200'
                          : crossed && childMode === 'B'
                            ? 'bg-blue-200'
                            : roomColor + ' bg-opacity-70'
                    }`}>
                      <div className="font-bold text-slate-800 leading-tight truncate" style={{ fontSize: '9px' }}>
                        {meeting?.title.slice(0, 14) ?? '?'}
                      </div>
                      {cell.span > 1 && (
                        <div className="text-slate-600 leading-tight truncate" style={{ fontSize: '8px' }}>
                          {rooms[cell.roomIdx]?.name.slice(0, 10) ?? '?'}
                        </div>
                      )}
                      {mutated && (
                        <div className="text-orange-700 font-bold" style={{ fontSize: '8px' }}>⚡ đột biến</div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function AnimationTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [frames, setFrames] = useState<Frame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1400);
  const [built, setBuilt] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: m }, { data: r }, { data: p }] = await Promise.all([
        supabase.from('meetings').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('participants').select('*'),
      ]);
      if (!m?.length || !r?.length || !p?.length) {
        setLoadError('Chưa có dữ liệu. Vào tab "Chạy GA" → "Tạo Dữ Liệu Mẫu" trước.');
        return;
      }
      setMeetings(m as Meeting[]);
      setRooms(r as Room[]);
      setParticipants(p as Participant[]);
      setDataLoaded(true);
    })();
  }, []);

  const startAnimation = useCallback(() => {
    if (!dataLoaded) return;
    const f = buildFrames(meetings, rooms, participants);
    setFrames(f);
    setFrameIdx(0);
    setPlaying(false);
    setBuilt(true);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [dataLoaded, meetings, rooms, participants]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing && frames.length > 0) {
      timerRef.current = setInterval(() => {
        setFrameIdx(prev => {
          if (prev >= frames.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, speed);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speed, frames.length]);

  const frame = frames[frameIdx] ?? null;
  const meta = frame ? PHASE_META[frame.phase] : null;
  const progress = frames.length > 1 ? (frameIdx / (frames.length - 1)) * 100 : 0;

  // Best individual for calendar
  const bestIndividual = frame?.population[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Hoạt Họa Giải Thuật Di Truyền</h1>
        <p className="text-slate-300 text-sm">
          Xem từng bước GA qua biểu đồ cột fitness, lịch họp trực quan và đồ thị hội tụ
        </p>
      </div>

      {!dataLoaded ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Dna className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium mb-1">{loadError || 'Đang tải...'}</p>
          {loadError && <p className="text-slate-400 text-sm">Vào tab "Chạy GA" → nhấn "Tạo Dữ Liệu Mẫu"</p>}
        </div>
      ) : !built ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Play className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-slate-700 font-semibold text-lg mb-2">Sẵn sàng minh họa</p>
          <p className="text-slate-400 text-sm mb-6">
            {meetings.length} cuộc họp · {rooms.length} phòng · {GENS} thế hệ · {POP} cá thể
          </p>
          <button
            onClick={startAnimation}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors shadow-md shadow-blue-200"
          >
            <Play className="w-4 h-4" /> Bắt đầu minh họa
          </button>
        </div>
      ) : frame && meta ? (
        <>
          {/* Controls row */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setFrameIdx(0)} disabled={frameIdx === 0}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <SkipBack className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={() => setFrameIdx(f => Math.max(0, f - 1))} disabled={frameIdx === 0}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600 rotate-180" />
              </button>
              <button onClick={() => setPlaying(p => !p)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
                {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {playing ? 'Dừng' : 'Phát'}
              </button>
              <button onClick={() => setFrameIdx(f => Math.min(frames.length - 1, f + 1))} disabled={frameIdx === frames.length - 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={() => setFrameIdx(frames.length - 1)} disabled={frameIdx === frames.length - 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                <SkipForward className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={startAnimation} title="Tạo lại"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                <RefreshCw className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            {/* Speed */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-slate-500 whitespace-nowrap">Tốc độ:</span>
              <input type="range" min={300} max={2500} step={100} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="flex-1 h-1.5 accent-blue-600" />
              <span className="text-xs font-mono text-slate-500 w-10 text-right">{(speed / 1000).toFixed(1)}s</span>
            </div>
            <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{frameIdx + 1}/{frames.length}</span>
          </div>

          {/* Progress */}
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Phase banner */}
          <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 flex items-start gap-4`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.border} border bg-white shadow-sm`}>
              <span className={meta.color}>{meta.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${meta.color} px-2 py-0.5 rounded-lg border ${meta.border} bg-white`}>
                  {meta.label}
                </span>
                <h2 className="font-bold text-slate-800 text-sm">{frame.title}</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{frame.explanation}</p>
            </div>
            {/* Stats */}
            <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
              <span className="text-xs text-slate-400">Fitness tốt nhất</span>
              <span className="text-2xl font-bold text-emerald-600">{frame.population[0]?.fitness.toFixed(1)}</span>
              <span className="text-xs text-slate-400">Thế hệ {frame.generation}/{GENS}</span>
            </div>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Column 1: Population bar chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Quần Thể — Fitness ({POP} cá thể)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Chiều cao cột = điểm fitness (0–100)</p>
              </div>
              <FitnessBarChart
                population={frame.population}
                parentAIdx={frame.parentAIdx}
                parentBIdx={frame.parentBIdx}
                phase={frame.phase}
              />
              {/* Legend */}
              <div className="px-4 pb-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Tốt nhất</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Cha</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Mẹ</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm border-2 border-amber-400 inline-block" /> Tinh hoa</span>
              </div>
            </div>

            {/* Column 2: Best schedule calendar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">
                  {(frame.phase === 'crossover' || frame.phase === 'mutate') && frame.childA
                    ? 'Lịch — Con A (sau ' + (frame.phase === 'crossover' ? 'lai ghép' : 'đột biến') + ')'
                    : 'Lịch — Cá Thể Tốt Nhất'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fitness: <strong className="text-emerald-600">
                    {(frame.phase === 'crossover' || frame.phase === 'mutate') && frame.childA
                      ? frame.childA.fitness.toFixed(1)
                      : bestIndividual?.fitness.toFixed(1)}
                  </strong>
                </p>
              </div>
              <div className="p-3">
                {(frame.phase === 'crossover' || frame.phase === 'mutate') && frame.childA ? (
                  <ScheduleCalendar
                    chromosome={frame.childA.chromosome}
                    meetings={meetings}
                    rooms={rooms}
                    mutatedGenes={frame.phase === 'mutate' ? frame.mutatedGenes : []}
                    crossoverPoint={frame.phase === 'crossover' ? frame.crossoverPoint : null}
                    childMode="A"
                  />
                ) : bestIndividual ? (
                  <ScheduleCalendar
                    chromosome={bestIndividual.chromosome}
                    meetings={meetings}
                    rooms={rooms}
                  />
                ) : null}
              </div>
              {/* Room legend */}
              <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                {rooms.map((r, i) => (
                  <span key={r.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${ROOM_LIGHT[i % ROOM_LIGHT.length]}`}>
                    <span className={`w-2 h-2 rounded-full ${ROOM_COLORS[i % ROOM_COLORS.length]}`} />
                    {r.name.replace('Phòng họp ', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* Column 3: Child B calendar + Convergence */}
            <div className="space-y-4">
              {/* Child B when crossover/mutate */}
              {(frame.phase === 'crossover' || frame.phase === 'mutate') && frame.childB ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Lịch — Con B (sau {frame.phase === 'crossover' ? 'lai ghép' : 'đột biến'})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fitness: <strong className="text-blue-600">{frame.childB.fitness.toFixed(1)}</strong>
                    </p>
                  </div>
                  <div className="p-3">
                    <ScheduleCalendar
                      chromosome={frame.childB.chromosome}
                      meetings={meetings}
                      rooms={rooms}
                      mutatedGenes={frame.phase === 'mutate' ? frame.mutatedGenes : []}
                      crossoverPoint={frame.phase === 'crossover' ? frame.crossoverPoint : null}
                      childMode="B"
                    />
                  </div>
                </div>
              ) : null}

              {/* Convergence chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Đồ Thị Hội Tụ</h3>
                  <div className="flex gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="w-4 h-0.5 bg-blue-500 rounded inline-block" /> Fitness tốt nhất
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="w-4 h-0.5 bg-teal-500 rounded inline-block" style={{ borderStyle: 'dashed' }} /> Trung bình
                    </span>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <ConvergenceChart data={frame.convergence} currentGen={frame.generation} />
                </div>
                {frame.convergence.length > 0 && (
                  <div className="px-4 pb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-slate-400">Bắt đầu</div>
                      <div className="font-bold text-slate-700">{frame.convergence[0].best.toFixed(1)}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2 text-center">
                      <div className="text-emerald-500">Hiện tại</div>
                      <div className="font-bold text-emerald-700">{frame.convergence[frame.convergence.length - 1].best.toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Phase stepper */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3">Luồng GA</h3>
                <div className="space-y-1.5">
                  {(Object.entries(PHASE_META) as [Phase, typeof PHASE_META[Phase]][]).map(([ph, m]) => (
                    <div key={ph} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all ${frame.phase === ph ? m.bg + ' ' + m.border + ' border' : ''}`}>
                      <span className={`${frame.phase === ph ? m.color : 'text-slate-300'}`}>{m.icon}</span>
                      <span className={`text-xs ${frame.phase === ph ? 'font-bold ' + m.color : 'text-slate-400'}`}>{m.label}</span>
                      {frame.phase === ph && (
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${m.bg} ${m.color} border ${m.border}`}>
                          Đang chạy
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
