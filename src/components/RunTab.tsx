import { useState, useRef, useCallback } from 'react';
import { Play, RefreshCw, Database, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Meeting, Participant, Room, GAParameters, GenerationData } from '../lib/supabase';
import { runGA } from '../lib/ga';
import type { Individual } from '../lib/ga';
import { clearAndSeedData } from '../lib/sampleData';

type RunStatus = 'idle' | 'seeding' | 'running' | 'done' | 'error';

type Props = {
  onRunComplete: (runId: string) => void;
};

export default function RunTab({ onRunComplete }: Props) {
  const [params, setParams] = useState<GAParameters>({
    generations: 100,
    population_size: 50,
    crossover_rate: 0.8,
    mutation_rate: 0.05,
    elitism_count: 3,
  });
  const [status, setStatus] = useState<RunStatus>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentGen, setCurrentGen] = useState(0);
  const [currentBest, setCurrentBest] = useState(0);
  const [generationsData, setGenerationsData] = useState<GenerationData[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = useCallback((msg: string) => {
    setLog(prev => {
      const next = [...prev, msg];
      setTimeout(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
      }, 10);
      return next;
    });
  }, []);

  const handleSeedData = async () => {
    setStatus('seeding');
    setLog([]);
    setErrorMsg('');
    try {
      appendLog('[INFO] Đang xóa dữ liệu cũ...');
      await clearAndSeedData();
      appendLog('[OK]   Đã tạo 4 phòng họp');
      appendLog('[OK]   Đã tạo 15 người tham dự');
      appendLog('[OK]   Đã tạo 10 cuộc họp');
      appendLog('[DONE] Dữ liệu mẫu đã sẵn sàng!');
      setStatus('idle');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      appendLog(`[ERR]  ${msg}`);
      setStatus('error');
    }
  };

  const handleRunGA = async () => {
    setStatus('running');
    setProgress(0);
    setCurrentGen(0);
    setCurrentBest(0);
    setGenerationsData([]);
    setErrorMsg('');
    setLog([]);

    try {
      appendLog('[INFO] Đang tải dữ liệu từ Supabase...');
      const [{ data: meetings }, { data: rooms }, { data: participants }] = await Promise.all([
        supabase.from('meetings').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('participants').select('*'),
      ]);

      if (!meetings?.length) throw new Error('Không có dữ liệu cuộc họp. Vui lòng tạo dữ liệu mẫu trước.');
      if (!rooms?.length) throw new Error('Không có dữ liệu phòng họp.');
      if (!participants?.length) throw new Error('Không có dữ liệu người tham dự.');

      appendLog(`[OK]   ${meetings.length} cuộc họp, ${rooms.length} phòng, ${participants.length} người`);
      appendLog(`[INFO] Bắt đầu GA: ${params.generations} thế hệ, quần thể = ${params.population_size}`);

      const m = meetings as Meeting[];
      const r = rooms as Room[];
      const p = participants as Participant[];

      const { best, generationsData: gData } = await runGA(
        m, r, p, params,
        (gen, ind: Individual, allGens) => {
          setCurrentGen(gen);
          setCurrentBest(parseFloat(ind.fitness.toFixed(2)));
          setProgress(Math.round((gen / params.generations) * 100));
          setGenerationsData([...allGens]);
          if (gen % 10 === 0 || gen === params.generations) {
            appendLog(`[Thế hệ ${String(gen).padStart(3, '0')}] best=${ind.fitness.toFixed(2)}, avg=${allGens[allGens.length - 1].avg_fitness.toFixed(2)}`);
          }
        }
      );

      appendLog(`[DONE] GA hoàn thành! Fitness tối ưu: ${best.fitness.toFixed(2)}/100`);

      // Save to Supabase
      appendLog('[INFO] Đang lưu kết quả...');
      const { data: runData, error: runErr } = await supabase.from('schedule_runs').insert({
        run_name: `Chạy GA ${new Date().toLocaleString('vi-VN')}`,
        parameters: params,
        final_fitness: best.fitness,
        generations_data: gData,
      }).select().maybeSingle();

      if (runErr || !runData) throw new Error('Không thể lưu kết quả');

      const scheduledRows = best.chromosome.map(gene => ({
        schedule_run_id: runData.id,
        meeting_id: m[gene.meetingIndex].id,
        room_id: r[gene.roomIndex].id,
        time_slot: gene.timeSlot,
        conflicts: 0,
      }));
      await supabase.from('scheduled_meetings').insert(scheduledRows);

      appendLog(`[OK]   Kết quả đã lưu vào Supabase (id: ${runData.id.slice(0, 8)}...)`);
      setStatus('done');
      onRunComplete(runData.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      appendLog(`[ERR]  ${msg}`);
      setStatus('error');
    }
  };

  const chartH = 160;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Chạy Giải Thuật Di Truyền</h1>
        <p className="text-slate-300 text-sm">Tùy chỉnh tham số GA, tạo dữ liệu mẫu và xem kết quả hội tụ theo thời gian thực</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Parameters */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-4">Tham Số GA</h2>
            <div className="space-y-4">
              {[
                { key: 'generations',    label: 'Số thế hệ',            min: 20,   max: 500, step: 10,   unit: '' },
                { key: 'population_size',label: 'Kích thước quần thể',  min: 10,   max: 200, step: 5,    unit: '' },
                { key: 'crossover_rate', label: 'Tỉ lệ lai ghép',       min: 0.3,  max: 1,   step: 0.05, unit: '%' },
                { key: 'mutation_rate',  label: 'Tỉ lệ đột biến',       min: 0.01, max: 0.3, step: 0.01, unit: '%' },
                { key: 'elitism_count',  label: 'Số cá thể tinh hoa',   min: 1,    max: 10,  step: 1,    unit: '' },
              ].map(({ key, label, min, max, step, unit }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">{label}</label>
                    <span className="text-sm font-mono font-bold text-blue-600">
                      {unit === '%'
                        ? `${((params[key as keyof GAParameters] as number) * 100).toFixed(0)}%`
                        : params[key as keyof GAParameters]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={params[key as keyof GAParameters] as number}
                    onChange={e =>
                      setParams(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))
                    }
                    disabled={status === 'running' || status === 'seeding'}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                    <span>{min}{unit === '%' ? '%' : ''}</span>
                    <span>{max}{unit === '%' ? '%' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={handleSeedData}
              disabled={status === 'running' || status === 'seeding'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white rounded-xl font-medium transition-colors"
            >
              {status === 'seeding' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Tạo Dữ Liệu Mẫu
            </button>
            <button
              onClick={handleRunGA}
              disabled={status === 'running' || status === 'seeding'}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold transition-colors shadow-md shadow-blue-200"
            >
              {status === 'running' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : status === 'done' ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {status === 'running' ? 'Đang chạy...' : status === 'done' ? 'Chạy lại' : 'Chạy GA'}
            </button>
          </div>

          {/* Status Cards */}
          {status !== 'idle' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Thế hệ hiện tại</span>
                <span className="font-mono font-bold text-slate-800">{currentGen} / {params.generations}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Fitness tốt nhất</span>
                <span className="font-mono font-bold text-emerald-600">{currentBest.toFixed(2)}</span>
              </div>
              {status === 'done' && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Hoàn thành! Xem tab Kết Quả
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}
              {status === 'error' && (
                <div className="text-sm text-red-600">{errorMsg}</div>
              )}
              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Chart + Log */}
        <div className="lg:col-span-2 space-y-4">
          {/* Fitness Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-bold text-slate-800 mb-1">Biểu Đồ Hội Tụ Fitness</h2>
            <p className="text-xs text-slate-400 mb-4">Theo dõi giá trị fitness qua các thế hệ (cập nhật theo thời gian thực)</p>
            <div className="relative" style={{ height: chartH + 40 }}>
              {generationsData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Play className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-400">Biểu đồ sẽ hiện thị khi GA chạy</p>
                  </div>
                </div>
              ) : (
                <svg width="100%" height={chartH + 40} className="overflow-visible">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(v => {
                    const y = chartH - (v / 100) * chartH;
                    return (
                      <g key={v}>
                        <line x1="40" y1={y} x2="100%" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                        <text x="34" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
                      </g>
                    );
                  })}

                  {/* Best fitness line */}
                  {(() => {
                    const pts = generationsData.map((d, i) => {
                      const x = 40 + (i / Math.max(generationsData.length - 1, 1)) * 640;
                      const y = chartH - (d.best_fitness / 100) * chartH;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <polyline
                        points={pts}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    );
                  })()}

                  {/* Avg fitness line */}
                  {(() => {
                    const pts = generationsData.map((d, i) => {
                      const x = 40 + (i / Math.max(generationsData.length - 1, 1)) * 640;
                      const y = chartH - (d.avg_fitness / 100) * chartH;
                      return `${x},${y}`;
                    }).join(' ');
                    return (
                      <polyline
                        points={pts}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        strokeLinejoin="round"
                      />
                    );
                  })()}
                </svg>
              )}
              {/* Legend */}
              <div className="absolute bottom-0 right-0 flex gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-blue-500 rounded" />
                  <span className="text-slate-500">Fitness tốt nhất</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-teal-500 rounded" />
                  <span className="text-slate-500">Trung bình</span>
                </div>
              </div>
            </div>
          </div>

          {/* Log Console */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-sm">
            <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-xs text-slate-400 font-mono ml-2">ga-console</span>
            </div>
            <div
              ref={logRef}
              className="h-48 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-0.5"
            >
              {log.length === 0 ? (
                <span className="text-slate-600">Nhấn "Tạo Dữ Liệu Mẫu" rồi "Chạy GA" để bắt đầu...</span>
              ) : (
                log.map((line, i) => (
                  <div key={i} className={
                    line.startsWith('[ERR]')  ? 'text-red-400' :
                    line.startsWith('[OK]') || line.startsWith('[DONE]') ? 'text-emerald-400' :
                    line.startsWith('[INFO]') ? 'text-blue-400' :
                    'text-slate-300'
                  }>
                    <span className="text-slate-600 select-none mr-2">{String(i + 1).padStart(3, '0')}</span>
                    {line}
                  </div>
                ))
              )}
              {status === 'running' && (
                <div className="text-slate-500 animate-pulse">_</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
