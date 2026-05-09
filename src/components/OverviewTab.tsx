import { useState } from 'react';
import {
  Target, Building2, Users, Calendar, AlertTriangle, CheckCircle,
  Dna, Shuffle, GitMerge, Zap, Trophy, ArrowRight, ArrowDown,
  TrendingUp, Clock, BarChart2, Search, Cpu, ChevronDown, ChevronUp,
  FileDown, Loader2,
} from 'lucide-react';
import { exportOverviewPdf } from '../lib/exportPdf';
import { exportOverviewDocx } from '../lib/exportDocx';

// ─── Section 1: Problem ────────────────────────────────────────────────────────

function ProblemSection() {
  const [expandConflict, setExpandConflict] = useState(false);

  return (
    <section id="section-problem" className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 text-white shadow-2xl">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-6">
            <Target className="w-3.5 h-3.5" />
            Bài Toán Tối Ưu Hóa
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Xếp Lịch Họp Tối Ưu<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Cho Cơ Quan
            </span>
          </h1>

          <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-3xl">
            Bài toán <strong className="text-white">NP-khó</strong>: với{' '}
            <strong className="text-white">10 cuộc họp</strong>,{' '}
            <strong className="text-white">4 phòng</strong> và{' '}
            <strong className="text-white">15 người tham dự</strong>, không gian tìm kiếm vượt qua{' '}
            <strong className="text-white">10<sup>18</sup></strong> phương án — Giải thuật di truyền
            (GA) giải quyết hiệu quả bằng tiến hóa.
          </p>

          {/* Search space visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <Building2 className="w-4 h-4" />, label: '4 Phòng họp', sub: 'Sức chứa 8–50 người', color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' },
              { icon: <Users className="w-4 h-4" />, label: '15 Cán bộ', sub: '6 phòng ban', color: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' },
              { icon: <Calendar className="w-4 h-4" />, label: '40 Khung giờ', sub: '5 ngày × 8 slot (30 phút)', color: 'bg-amber-500/20 border-amber-400/30 text-amber-300' },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${item.color}`}>
                {item.icon}
                <div>
                  <div className="font-bold text-sm">{item.label}</div>
                  <div className="text-xs opacity-70">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NP-hard explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-red-500" />
            Tại Sao Khó?
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Mỗi cuộc họp có thể được gán vào bất kỳ tổ hợp nào của <strong>4 phòng × 40 khung giờ = 160 lựa chọn</strong>.
            Với 10 cuộc họp độc lập:
          </p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm mb-4">
            <div className="text-slate-400 text-xs mb-2">// Không gian tìm kiếm</div>
            <div className="text-emerald-400">160<sup>10</sup> = <span className="text-white">1,099,511,627,776,000,000,000</span></div>
            <div className="text-slate-500 text-xs mt-1">≈ 10<sup>21</sup> phương án có thể</div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Nếu máy tính đánh giá <strong>1 tỷ phương án/giây</strong>, kiểm tra toàn bộ sẽ mất{' '}
            <strong className="text-red-600">34.865 năm</strong>. Brute-force hoàn toàn không khả thi.
          </p>
        </div>

        {/* Conflict types */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Các Loại Xung Đột
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { icon: '🏢', label: 'Trùng phòng',   desc: '2 cuộc họp cùng phòng, cùng giờ', penalty: 100, color: 'bg-red-50 text-red-700 border-red-200' },
              { icon: '👤', label: 'Trùng người',   desc: 'Người tham dự 2 họp cùng lúc',     penalty: 80,  color: 'bg-rose-50 text-rose-700 border-rose-200' },
              { icon: '📐', label: 'Chật phòng',    desc: 'Số người > sức chứa phòng',          penalty: 50,  color: 'bg-orange-50 text-orange-700 border-orange-200' },
              { icon: '⏰', label: 'Tràn giờ',      desc: 'Họp chưa xong đã hết ngày làm việc', penalty: 40,  color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { icon: '📵', label: 'Thiếu thiết bị', desc: 'Phòng không có máy chiếu / video',   penalty: 20,  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { icon: '📅', label: 'Người bận',     desc: 'Mời người vào lúc họ không rảnh',    penalty: 15,  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].slice(0, expandConflict ? 6 : 4).map((c, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="text-lg flex-shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800">{c.label}</div>
                  <div className="text-xs text-slate-500">{c.desc}</div>
                </div>
                <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold border ${c.color}`}>
                  -{c.penalty}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setExpandConflict(e => !e)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
          >
            {expandConflict ? <><ChevronUp className="w-3.5 h-3.5" /> Thu gọn</> : <><ChevronDown className="w-3.5 h-3.5" /> Xem thêm</>}
          </button>
        </div>
      </div>

      {/* Meetings table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-slate-800">Danh Sách 10 Cuộc Họp Cần Xếp Lịch</h2>
            <p className="text-sm text-slate-500 mt-0.5">Mỗi cuộc họp có ràng buộc riêng về phòng, thiết bị và người tham dự</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">10 cuộc họp</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Tên cuộc họp</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Ưu tiên</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Thời lượng</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Người</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Thiết bị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { title: 'Họp giao ban tuần — BGĐ',  priority: 5, dur: '60 phút',  ppl: 5, eq: ['Máy chiếu', 'Bảng trắng'] },
                { title: 'Review dự án CNTT Q2',      priority: 4, dur: '90 phút',  ppl: 4, eq: ['Máy chiếu', 'Bảng trắng'] },
                { title: 'Họp kế hoạch kinh doanh',  priority: 4, dur: '60 phút',  ppl: 4, eq: ['Máy chiếu'] },
                { title: 'Tuyển dụng nhân sự mới',   priority: 3, dur: '60 phút',  ppl: 3, eq: ['Bảng trắng'] },
                { title: 'Đào tạo kỹ năng mềm',      priority: 2, dur: '120 phút', ppl: 8, eq: ['Máy chiếu', 'Micro'] },
                { title: 'Họp chiến lược marketing', priority: 4, dur: '60 phút',  ppl: 4, eq: ['Máy chiếu', 'Bảng trắng'] },
                { title: 'Kiểm tra tài chính tháng', priority: 3, dur: '60 phút',  ppl: 3, eq: ['Bảng trắng'] },
                { title: 'Họp đối tác quốc tế',      priority: 5, dur: '60 phút',  ppl: 4, eq: ['Video conf'] },
                { title: 'Xem xét kế hoạch năm',     priority: 5, dur: '90 phút',  ppl: 7, eq: ['Máy chiếu', 'Bảng trắng'] },
                { title: 'Sprint planning CNTT',      priority: 3, dur: '60 phút',  ppl: 3, eq: ['Bảng trắng'] },
              ].map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} className={`w-2.5 h-2.5 rounded-sm transition-colors ${n <= m.priority ? 'bg-amber-400' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                      <Clock className="w-3 h-3 text-slate-400" /> {m.dur}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                      <Users className="w-3 h-3 text-slate-400" /> {m.ppl}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.eq.map((e, j) => (
                        <span key={j} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{e}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─── Section 2: GA Solution ────────────────────────────────────────────────────

function GASection() {
  return (
    <section id="section-ga" className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-widest mb-5">
          <Dna className="w-3.5 h-3.5" />
          Phương Pháp Giải Quyết
        </div>
        <h2 className="text-3xl font-extrabold mb-3">Giải Thuật Di Truyền (GA)</h2>
        <p className="text-slate-300 leading-relaxed max-w-3xl text-base mb-6">
          GA mô phỏng tiến hóa tự nhiên: một <strong className="text-white">quần thể</strong> các phương án lịch họp
          cạnh tranh nhau, được chọn lọc, kết hợp và đột biến qua nhiều <strong className="text-white">thế hệ</strong> —
          hội tụ dần về phương án tối ưu mà không cần duyệt toàn bộ không gian tìm kiếm.
        </p>

        {/* GA Loop flow */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Quần thể ban đầu', icon: <Shuffle className="w-3.5 h-3.5" /> },
            { label: 'Đánh giá Fitness', icon: <Trophy className="w-3.5 h-3.5" /> },
            { label: 'Chọn lọc', icon: <Dna className="w-3.5 h-3.5" /> },
            { label: 'Lai ghép', icon: <GitMerge className="w-3.5 h-3.5" /> },
            { label: 'Đột biến', icon: <Zap className="w-3.5 h-3.5" /> },
            { label: 'Thế hệ mới', icon: <TrendingUp className="w-3.5 h-3.5" /> },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-sm text-white">
                {step.icon} {step.label}
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
            </div>
          ))}
          <div className="text-slate-400 text-xs italic ml-1">← lặp N thế hệ</div>
        </div>
      </div>

      {/* Chromosome encoding */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-5 flex items-center gap-2">
          <Dna className="w-5 h-5 text-teal-500" />
          Biểu Diễn Bài Toán — Chromosome Encoding
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Mỗi <strong>phương án lịch họp</strong> được mã hóa thành một <strong>Chromosome</strong> — mảng các gen.
              Mỗi <strong>Gen</strong> biểu diễn một cuộc họp với 3 thuộc tính:
            </p>
            <div className="space-y-2.5">
              {[
                { abbr: 'M', label: 'meetingIndex', desc: 'Chỉ số cuộc họp (0–9)', bg: 'bg-blue-100 text-blue-700' },
                { abbr: 'R', label: 'roomIndex',    desc: 'Phòng được gán (0–3)',  bg: 'bg-emerald-100 text-emerald-700' },
                { abbr: 'T', label: 'timeSlot',     desc: 'Giờ bắt đầu (0–39)',   bg: 'bg-amber-100 text-amber-700' },
              ].map(attr => (
                <div key={attr.abbr} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${attr.bg}`}>{attr.abbr}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-700 font-mono">{attr.label}</div>
                    <div className="text-xs text-slate-500">{attr.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual chromosome */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Ví dụ — Chromosome 5 gen (5 cuộc họp)</div>
            {/* Chromosome strip */}
            <div className="flex gap-1 mb-3">
              {[
                { label: 'Họp BGĐ',    color: 'bg-blue-400' },
                { label: 'Review CNTT', color: 'bg-emerald-400' },
                { label: 'KH Kinh doanh', color: 'bg-amber-400' },
                { label: 'Nhân sự',    color: 'bg-rose-400' },
                { label: 'Đào tạo',    color: 'bg-teal-400' },
              ].map((g, i) => (
                <div key={i} className={`flex-1 h-10 rounded-md ${g.color} flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-bold text-center leading-tight px-1">{g.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {[
                { meeting: 'Họp BGĐ',         room: 'Phòng B202', day: 'Thứ Hai', time: '08:00', ok: true },
                { meeting: 'Review CNTT',      room: 'Phòng A101', day: 'Thứ Hai', time: '09:00', ok: true },
                { meeting: 'KH Kinh doanh',    room: 'Phòng B202', day: 'Thứ Ba',  time: '10:00', ok: true },
                { meeting: 'Nhân sự',          room: 'Phòng C303', day: 'Thứ Tư',  time: '14:00', ok: true },
                { meeting: 'Đào tạo kỹ năng',  room: 'Hội trường', day: 'Thứ Năm', time: '08:00', ok: true },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-mono font-bold text-slate-600 flex-shrink-0">{i + 1}</span>
                  <span className="font-medium text-slate-700 w-32 truncate">{r.meeting}</span>
                  <span className="text-slate-500 flex-1">{r.room}</span>
                  <span className="text-slate-400 whitespace-nowrap">{r.day} {r.time}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5 steps */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800 text-base">5 Bước Thực Thi GA</h3>
        {[
          {
            num: '01', phase: 'Khởi tạo', eng: 'Initialization',
            icon: <Shuffle className="w-5 h-5" />,
            color: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-500', dark: 'bg-blue-950' },
            desc: `Tạo ngẫu nhiên ${50} cá thể (population_size = 50). Mỗi cá thể là một Chromosome mã hóa toàn bộ phương án lịch họp cho tuần.`,
            code: `// Khởi tạo ngẫu nhiên
chromosome = meetings.map(m => ({
  meetingIndex: i,
  roomIndex:    rand(validRooms),
  timeSlot:     rand(0, 39)
}))`,
          },
          {
            num: '02', phase: 'Đánh giá', eng: 'Fitness Evaluation',
            icon: <Trophy className="w-5 h-5" />,
            color: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500', dark: 'bg-amber-950' },
            desc: 'Tính điểm fitness = 1000 / (1 + tổng phạt). Mỗi xung đột cộng thêm phạt. Cá thể hoàn hảo (không xung đột) đạt fitness ≈ 100.',
            code: `fitness(x) = 1000 / (1 + penalty)

penalty += 100 // Trùng phòng
penalty += 80  // Trùng người
penalty += 50  // Phòng chật
penalty += 40  // Tràn ngày
penalty += 20  // Thiếu TB`,
          },
          {
            num: '03', phase: 'Chọn lọc', eng: 'Tournament Selection',
            icon: <Dna className="w-5 h-5" />,
            color: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-500', dark: 'bg-emerald-950' },
            desc: 'Tournament Selection: chọn ngẫu nhiên 3 cá thể, giữ lại cá thể tốt nhất làm "cha/mẹ". Elitism giữ top-2 tốt nhất sang thế hệ sau.',
            code: `// Tournament (k=3)
best = max(
  random_pick(pop, 3),
  key = fitness
)

// Elitism
nextGen = top(2, population)`,
          },
          {
            num: '04', phase: 'Lai ghép', eng: 'Single-Point Crossover',
            icon: <GitMerge className="w-5 h-5" />,
            color: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-500', dark: 'bg-rose-950' },
            desc: 'Chọn điểm cắt ngẫu nhiên trên chromosome. Con A = nửa đầu Cha + nửa sau Mẹ. Con B = nửa đầu Mẹ + nửa sau Cha. Xác suất lai ghép: 80%.',
            code: `// Xác suất 80%
point = rand(1, N-1)

childA = [A[0..pt], B[pt..N]]
childB = [B[0..pt], A[pt..N]]`,
          },
          {
            num: '05', phase: 'Đột biến', eng: 'Random Mutation',
            icon: <Zap className="w-5 h-5" />,
            color: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500', dark: 'bg-orange-950' },
            desc: 'Mỗi gen có 5% xác suất bị thay đổi ngẫu nhiên. Đột biến giữ đa dạng quần thể, tránh hội tụ sớm vào cực trị cục bộ.',
            code: `// Xác suất 5%/gen
chromosome = chromosome.map(g =>
  rand() < 0.05
    ? randomGene(meeting, rooms)
    : g
)`,
          },
        ].map(step => (
          <div key={step.num} className={`rounded-2xl border ${step.color.border} overflow-hidden`}>
            <div className={`${step.color.bg} px-6 py-4 flex items-start gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${step.color.badge} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className={`text-xs font-mono font-bold ${step.color.text} opacity-60`}>BƯỚC {step.num}</span>
                  <h4 className="font-bold text-slate-800">{step.phase}</h4>
                  <span className={`text-xs font-medium ${step.color.text} hidden sm:inline`}>{step.eng}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
            <div className={`px-6 py-3 border-t border-slate-100 ${step.color.dark}`}>
              <pre className="text-xs text-emerald-300 font-mono leading-relaxed overflow-x-auto">{step.code}</pre>
            </div>
          </div>
        ))}
      </div>

      {/* Fitness formula deep-dive */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-5 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          Hàm Fitness Chi Tiết
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="bg-slate-900 rounded-xl p-4 font-mono text-sm mb-4">
              <div className="text-slate-400 text-xs mb-2">// Hàm fitness (JavaScript)</div>
              <div className="text-blue-300">fitness<span className="text-white">(chromosome) =</span></div>
              <div className="ml-4 text-white">1000 / (1 + <span className="text-red-400">penalty</span>)</div>
              <br />
              <div className="text-slate-400 text-xs">// Giá trị trả về: 0 &lt; fitness ≤ 100</div>
              <div className="text-slate-400 text-xs">// Khi penalty = 0 → fitness ≈ 100 (hoàn hảo)</div>
              <div className="text-slate-400 text-xs">// Khi penalty = 999 → fitness ≈ 1 (rất tệ)</div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Hàm fitness được thiết kế để luôn dương, giảm dần khi phạt tăng. Đây là hàm{' '}
              <strong>nghịch đảo hyperbolic</strong> — phù hợp với GA vì tạo gradient mượt
              để phân biệt rõ các cá thể.
            </p>
          </div>
          {/* Fitness visualization */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Fitness theo mức phạt</div>
            <div className="space-y-2">
              {[
                { label: 'Không xung đột',  penalty: 0,   fitness: 100,  color: 'bg-emerald-500' },
                { label: '1 xung đột nhỏ',  penalty: 20,  fitness: 98,   color: 'bg-emerald-400' },
                { label: '2 xung đột',       penalty: 100, fitness: 91,   color: 'bg-amber-400' },
                { label: '5 xung đột',       penalty: 300, fitness: 77,   color: 'bg-orange-400' },
                { label: '10 xung đột',      penalty: 700, fitness: 59,   color: 'bg-rose-500' },
                { label: 'Rất nhiều lỗi',   penalty: 999, fitness: 50,   color: 'bg-red-600' },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <div className="w-32 text-slate-600 flex-shrink-0">{row.label}</div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                      style={{ width: `${row.fitness}%` }}
                    />
                  </div>
                  <div className="w-16 text-right font-bold text-slate-700 font-mono">{row.fitness.toFixed(0)}/100</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">So Sánh Với Các Phương Pháp Khác</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Phương pháp', 'Độ phức tạp', '10 họp × 4 phòng × 40 slot', 'Chất lượng', 'Thực tế'].map(h => (
                  <th key={h} className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  name: 'Brute Force', complexity: 'O((R×T)^N)', result: '~10²¹ phương án',
                  quality: { label: 'Tối ưu tuyệt đối', color: 'bg-slate-100 text-slate-600' },
                  practical: { label: 'Không khả thi', color: 'bg-red-100 text-red-700' },
                  rowBg: 'bg-red-50/40',
                },
                {
                  name: 'Greedy', complexity: 'O(N × R × T)', result: '~1.600 đánh giá',
                  quality: { label: 'Cục bộ', color: 'bg-amber-100 text-amber-700' },
                  practical: { label: 'Chấp nhận được', color: 'bg-amber-100 text-amber-700' },
                  rowBg: 'bg-amber-50/40',
                },
                {
                  name: 'Genetic Algorithm', complexity: 'O(G × P × N)', result: '100 × 50 × 10 = 50.000 đánh giá',
                  quality: { label: 'Gần tối ưu', color: 'bg-emerald-100 text-emerald-700' },
                  practical: { label: 'Khả thi tốt', color: 'bg-emerald-100 text-emerald-700' },
                  rowBg: 'bg-emerald-50/60',
                },
              ].map((row, i) => (
                <tr key={i} className={row.rowBg}>
                  <td className="px-5 py-3 font-semibold text-slate-800">{row.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{row.complexity}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{row.result}</td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${row.quality.color}`}>{row.quality.label}</span></td>
                  <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${row.practical.color}`}>{row.practical.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 bg-slate-50 text-xs text-slate-400 border-t border-slate-100">
          G = số thế hệ · P = kích thước quần thể · N = số cuộc họp · R = số phòng · T = số khung giờ
        </div>
      </div>
    </section>
  );
}

// ─── Section 3: Results Explanation ───────────────────────────────────────────

function ResultsSection() {
  return (
    <section id="section-results" className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-5">
          <Trophy className="w-3.5 h-3.5" />
          Giải Thích Kết Quả
        </div>
        <h2 className="text-3xl font-extrabold mb-3">Đọc Hiểu Kết Quả GA</h2>
        <p className="text-slate-300 leading-relaxed max-w-3xl text-base">
          Sau khi GA chạy xong, hệ thống trả về phương án lịch họp tốt nhất tìm được cùng với
          các chỉ số phân tích. Đây là cách đọc và hiểu từng phần kết quả.
        </p>
      </div>

      {/* Fitness score guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-5 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-emerald-500" />
          Thang Điểm Fitness — Đánh Giá Phương Án
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { range: '90 – 100', label: 'Xuất sắc', desc: 'Hầu hết không có xung đột. Phương án tốt nhất có thể dùng trực tiếp.', color: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-500', textColor: 'text-emerald-700' },
            { range: '70 – 90',  label: 'Tốt',      desc: 'Vài xung đột nhỏ. Cần xem xét lại 1–2 cuộc họp cụ thể.', color: 'bg-teal-50 border-teal-200', badge: 'bg-teal-500', textColor: 'text-teal-700' },
            { range: '50 – 70',  label: 'Chấp nhận', desc: 'Có xung đột đáng kể. Cần điều chỉnh thêm hoặc tăng số thế hệ.', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-500', textColor: 'text-amber-700' },
            { range: '< 50',    label: 'Kém',       desc: 'Nhiều xung đột. Tăng số thế hệ, kích thước quần thể hoặc xem lại dữ liệu đầu vào.', color: 'bg-red-50 border-red-200', badge: 'bg-red-500', textColor: 'text-red-700' },
          ].map((tier, i) => (
            <div key={i} className={`rounded-xl border p-4 ${tier.color}`}>
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-white text-xs font-bold mb-2 ${tier.badge}`}>
                {tier.range}
              </div>
              <div className={`font-bold ${tier.textColor} mb-1`}>{tier.label}</div>
              <p className="text-xs text-slate-600 leading-relaxed">{tier.desc}</p>
            </div>
          ))}
        </div>

        {/* Convergence explanation */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="text-sm font-bold text-slate-700 mb-3">Đồ Thị Hội Tụ — Cách Đọc</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
              <div><strong className="text-slate-800">Đường tốt nhất</strong> — fitness của cá thể tốt nhất từng thế hệ. Nên tăng dần hoặc giữ nguyên.</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-teal-400 mt-1 flex-shrink-0" />
              <div><strong className="text-slate-800">Đường trung bình</strong> — fitness trung bình quần thể. Nếu 2 đường gặp nhau = quần thể đồng nhất quá sớm.</div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-200 mt-1 flex-shrink-0" />
              <div><strong className="text-slate-800">Vùng cải thiện</strong> — diện tích giữa fitness đầu và cuối. Càng lớn = GA cải thiện càng nhiều.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule output explanation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-base">Lịch Họp Đầu Ra — Cách Đọc</h3>
          <p className="text-sm text-slate-500 mt-0.5">Ví dụ phương án lịch họp hoàn hảo (fitness ≈ 95)</p>
        </div>

        {/* Sample calendar */}
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[500px]">
            <thead>
              <tr>
                <th className="text-slate-400 font-normal py-2 px-3 text-right w-16 border-b border-slate-100" />
                {['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'].map(d => (
                  <th key={d} className="text-center font-semibold text-slate-700 py-2 px-2 border-b border-slate-200">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { time: '08:00', cells: [
                  { label: 'Họp BGĐ', room: 'B202', span: 2, color: 'bg-blue-100 border-blue-300 text-blue-900' },
                  null, null, null,
                  { label: 'Xem xét KH năm', room: 'Hội trường', span: 3, color: 'bg-amber-100 border-amber-300 text-amber-900' },
                ]},
                { time: '08:30', cells: ['skip', null,
                  { label: 'Đào tạo KN mềm', room: 'Hội trường', span: 4, color: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
                  null, 'skip',
                ]},
                { time: '09:00', cells: [
                  { label: 'Review CNTT', room: 'A101', span: 3, color: 'bg-rose-100 border-rose-300 text-rose-900' },
                  null, 'skip',
                  { label: 'Sprint plan', room: 'C303', span: 2, color: 'bg-teal-100 border-teal-300 text-teal-900' },
                  'skip',
                ]},
                { time: '09:30', cells: ['skip', null, 'skip', 'skip', 'skip'] },
                { time: '10:00', cells: ['skip',
                  { label: 'KH Kinh doanh', room: 'B202', span: 2, color: 'bg-orange-100 border-orange-300 text-orange-900' },
                  'skip',
                  { label: 'Tuyển dụng', room: 'C303', span: 2, color: 'bg-slate-100 border-slate-300 text-slate-800' },
                  null,
                ]},
                { time: '10:30', cells: ['skip', 'skip', 'skip', 'skip', null] },
              ].map((row, ri) => (
                <tr key={ri}>
                  <td className="text-slate-400 py-1 px-3 text-right font-mono border-b border-slate-50 align-top">{row.time}</td>
                  {row.cells.map((cell, ci) => {
                    if (cell === 'skip') return null;
                    if (cell === null) return <td key={ci} className="border border-slate-100 bg-slate-50/30 p-1 min-w-[90px]" />;
                    if (typeof cell !== 'object') return null;
                    return (
                      <td key={ci} rowSpan={cell.span} className={`border px-2 py-1.5 align-top min-w-[90px] ${cell.color}`}>
                        <div className="font-bold text-[10px] leading-tight">{cell.label}</div>
                        <div className="text-[9px] opacity-70 mt-0.5">{cell.room}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: 'Không xung đột phòng', desc: 'Mỗi phòng chỉ có 1 cuộc họp tại một thời điểm' },
            { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: 'Không trùng người', desc: 'Không ai bị xếp vào 2 cuộc họp cùng lúc' },
            { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: 'Hoàn thành trong ngày', desc: 'Mọi cuộc họp kết thúc trước 17:30' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              {item.icon}
              <div>
                <div className="font-semibold text-emerald-800">{item.label}</div>
                <div className="text-emerald-600 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parameters guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-base mb-5 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          Tinh Chỉnh Tham Số GA — Khi Nào Cần Thay Đổi?
        </h3>
        <div className="space-y-3">
          {[
            {
              param: 'Số thế hệ (generations)',
              default_: '100',
              whenIncrease: 'Fitness vẫn tăng ở thế hệ cuối → GA chưa hội tụ, cần thêm thế hệ',
              whenDecrease: 'Fitness bằng phẳng từ thế hệ sớm → GA đã hội tụ, tiết kiệm thời gian',
              color: 'border-blue-200 bg-blue-50',
              textColor: 'text-blue-700',
            },
            {
              param: 'Kích thước quần thể (population)',
              default_: '50',
              whenIncrease: 'GA thường bị kẹt ở cực trị cục bộ → cần đa dạng hơn',
              whenDecrease: 'Cần kết quả nhanh, bài toán đơn giản → giảm để tăng tốc độ',
              color: 'border-emerald-200 bg-emerald-50',
              textColor: 'text-emerald-700',
            },
            {
              param: 'Tỷ lệ đột biến (mutation rate)',
              default_: '5%',
              whenIncrease: 'Quần thể hội tụ quá sớm (avg ≈ best từ đầu) → tăng để khám phá thêm',
              whenDecrease: 'Kết quả không ổn định, nhảy lên xuống nhiều → giảm để ổn định',
              color: 'border-orange-200 bg-orange-50',
              textColor: 'text-orange-700',
            },
            {
              param: 'Tỷ lệ lai ghép (crossover rate)',
              default_: '80%',
              whenIncrease: 'Quần thể đồng nhất quá nhanh → tăng để kết hợp gen nhiều hơn',
              whenDecrease: 'Cần bảo toàn các phương án tốt hoàn toàn → giảm một chút',
              color: 'border-rose-200 bg-rose-50',
              textColor: 'text-rose-700',
            },
          ].map((row, i) => (
            <div key={i} className={`rounded-xl border p-4 ${row.color}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${row.textColor}`}>{row.param}</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-white border ${row.color.replace('bg-', 'border-').split(' ')[0]} ${row.textColor}`}>
                    mặc định: {row.default_}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span><strong>Tăng khi:</strong> {row.whenIncrease}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600">
                  <ArrowDown className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <span><strong>Giảm khi:</strong> {row.whenDecrease}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-7 text-white">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2">Tóm Tắt</h3>
            <p className="text-slate-300 leading-relaxed text-sm max-w-3xl">
              GA không đảm bảo tìm ra phương án <em>tốt nhất tuyệt đối</em>, nhưng tìm được phương án{' '}
              <strong className="text-white">tốt nhất có thể trong thời gian hợp lý</strong> — đây chính là
              điểm mạnh của các thuật toán tiến hóa. Với bài toán xếp lịch họp có 10<sup>21</sup> phương án,
              GA chỉ cần đánh giá ~50.000 cá thể nhưng vẫn cho kết quả có fitness 90+ trong hầu hết các trường hợp.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: '50.000', sub: 'đánh giá thay vì 10²¹', icon: <Cpu className="w-4 h-4" /> },
                { label: '90+',    sub: 'fitness trung bình đạt được', icon: <Trophy className="w-4 h-4" /> },
                { label: '< 5s',   sub: 'thời gian chạy thực tế', icon: <Clock className="w-4 h-4" /> },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="text-teal-300">{stat.icon}</div>
                  <div>
                    <div className="text-xl font-extrabold text-white">{stat.label}</div>
                    <div className="text-xs text-slate-400">{stat.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

type ActiveSection = 'problem' | 'ga' | 'results';

const SECTIONS: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
  { id: 'problem', label: 'Mô Tả Bài Toán',          icon: <Target className="w-4 h-4" /> },
  { id: 'ga',      label: 'Cách Giải Quyết bằng GA', icon: <Dna className="w-4 h-4" /> },
  { id: 'results', label: 'Giải Thích Kết Quả',       icon: <Trophy className="w-4 h-4" /> },
];

export default function OverviewTab() {
  const [active, setActive] = useState<ActiveSection>('problem');
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  async function handleExport(type: 'pdf' | 'docx') {
    setExporting(type);
    try {
      if (type === 'pdf') await exportOverviewPdf();
      else await exportOverviewDocx();
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Section nav + export button */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex gap-1 items-center">
        <div className="flex flex-1 gap-1">
          {SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActive(sec.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active === sec.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {sec.icon}
              <span className="hidden sm:block">{sec.label}</span>
              <span className="sm:hidden text-xs">{sec.label.split(' ').slice(-1)}</span>
            </button>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex gap-1.5 ml-1">
          <button
            onClick={() => handleExport('docx')}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
            title="Xuất tài liệu Word (.docx) — Tiếng Việt đầy đủ"
          >
            {exporting === 'docx'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xuất...</>
              : <><FileDown className="w-4 h-4" /> Xuất DOCX</>
            }
          </button>
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
            title="Xuất tài liệu PDF"
          >
            {exporting === 'pdf'
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xuất...</>
              : <><FileDown className="w-4 h-4" /> Xuất PDF</>
            }
          </button>
        </div>
      </div>

      {/* Section content */}
      {active === 'problem' && <ProblemSection />}
      {active === 'ga'      && <GASection />}
      {active === 'results' && <ResultsSection />}
    </div>
  );
}
