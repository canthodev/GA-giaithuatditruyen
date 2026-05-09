import { Dna, Shuffle, GitMerge, Zap, Trophy, ArrowRight } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: <Shuffle className="w-5 h-5" />,
    title: 'Khởi Tạo Quần Thể',
    subtitle: 'Initialization',
    color: 'blue',
    desc: 'Tạo ngẫu nhiên N cá thể (individual), mỗi cá thể là một Chromosome biểu diễn một phương án xếp lịch hoàn chỉnh.',
    detail: 'Mỗi Chromosome là mảng N gen — mỗi gen tương ứng một cuộc họp, chứa: roomIndex (phòng được gán) và timeSlot (giờ bắt đầu, tính bằng đơn vị 30 phút).',
    code: `chromosome = [
  { meetingIdx: 0, roomIdx: 2, timeSlot: 8 },  // Họp 1: Phòng C, 13:30
  { meetingIdx: 1, roomIdx: 0, timeSlot: 2 },  // Họp 2: Phòng A, 09:00
  ...
]`,
  },
  {
    num: '02',
    icon: <Trophy className="w-5 h-5" />,
    title: 'Đánh Giá Fitness',
    subtitle: 'Fitness Evaluation',
    color: 'amber',
    desc: 'Tính điểm fitness cho từng cá thể dựa trên số lượng ràng buộc bị vi phạm. Fitness cao = phương án tốt hơn.',
    detail: 'Hàm fitness tích lũy phạt (penalty) cho mỗi ràng buộc bị vi phạm, sau đó chuyển thành điểm 0–100.',
    code: `fitness(x) = 1000 / (1 + penalty(x))

penalty += 100  // Trùng phòng họp
penalty += 80   // Trùng người tham dự
penalty += 50   // Phòng quá nhỏ
penalty += 40   // Cuộc họp tràn sang ngày mới
penalty += 20   // Thiếu thiết bị
penalty += 15   // Người bận (per slot)`,
  },
  {
    num: '03',
    icon: <Dna className="w-5 h-5" />,
    title: 'Chọn Lọc',
    subtitle: 'Selection',
    color: 'emerald',
    desc: 'Chọn các cá thể "cha mẹ" tốt để sinh sản. Sử dụng Tournament Selection: chọn ngẫu nhiên k cá thể, giữ lại cá thể tốt nhất.',
    detail: 'Elitism: giữ lại top-E cá thể tốt nhất sang thế hệ kế, đảm bảo kết quả không bị xấu đi qua các thế hệ.',
    code: `// Tournament Selection (k=3)
function select(population, k=3):
  candidates = random_sample(population, k)
  return max(candidates, key=fitness)

// Elitism: giữ top-E cá thể
nextGen = top(E, population)`,
  },
  {
    num: '04',
    icon: <GitMerge className="w-5 h-5" />,
    title: 'Lai Ghép',
    subtitle: 'Crossover',
    color: 'rose',
    desc: 'Kết hợp hai Chromosome cha mẹ tại điểm cắt ngẫu nhiên để tạo hai cá thể con mới. Xác suất lai ghép: 80%.',
    detail: 'Single-Point Crossover: chọn điểm cắt ngẫu nhiên, nửa đầu lấy từ cha, nửa sau lấy từ mẹ (và ngược lại).',
    code: `// Single-Point Crossover
parentA = [A1, A2 | A3, A4, A5]
parentB = [B1, B2 | B3, B4, B5]
                 ^-- điểm cắt

childA  = [A1, A2, B3, B4, B5]
childB  = [B1, B2, A3, A4, A5]`,
  },
  {
    num: '05',
    icon: <Zap className="w-5 h-5" />,
    title: 'Đột Biến',
    subtitle: 'Mutation',
    color: 'violet',
    desc: 'Thay đổi ngẫu nhiên một số gen với xác suất nhỏ (5%). Giúp khám phá không gian tìm kiếm, tránh hội tụ cục bộ.',
    detail: 'Mỗi gen có xác suất 5% bị thay thế bằng một gen mới ngẫu nhiên (phòng và giờ mới), trong khi vẫn thỏa mãn các ràng buộc cơ bản.',
    code: `// Mutation (rate = 5%)
for gene in chromosome:
  if random() < 0.05:
    // Thay bằng gen ngẫu nhiên mới
    gene.roomIdx = random_valid_room()
    gene.timeSlot = random_valid_slot()`,
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string; codeBg: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-500',   codeBg: 'bg-blue-950'   },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-500',  codeBg: 'bg-amber-950'  },
  emerald:{ bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700',badge: 'bg-emerald-500',codeBg: 'bg-emerald-950'},
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-500',   codeBg: 'bg-rose-950'   },
  violet: { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-700',  badge: 'bg-slate-600',  codeBg: 'bg-slate-950'  },
};

export default function AlgorithmTab() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Giải Thuật Di Truyền (Genetic Algorithm)</h1>
        <p className="text-slate-300 leading-relaxed max-w-3xl">
          GA mô phỏng quá trình tiến hóa tự nhiên: chọn lọc tự nhiên, di truyền và đột biến
          để tìm kiếm nghiệm tối ưu trong không gian lớn. Mỗi "cá thể" là một phương án lịch họp,
          "quần thể" là tập hợp các phương án, và "fitness" đo chất lượng từng phương án.
        </p>

        {/* Flow diagram */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {['Quần thể ban đầu', 'Đánh giá fitness', 'Chọn lọc', 'Lai ghép', 'Đột biến', 'Quần thể mới'].map((label, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white/10 text-sm font-medium text-white border border-white/20">
                {label}
              </div>
              {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </div>
          ))}
          <div className="ml-1 text-slate-400 text-sm italic">← Lặp lại qua N thế hệ</div>
        </div>
      </div>

      {/* Chromosome Encoding Explainer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Dna className="w-5 h-5 text-teal-500" />
          Mã Hóa Nhiễm Sắc Thể (Chromosome Encoding)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Mỗi <strong>Chromosome</strong> biểu diễn một phương án xếp lịch đầy đủ. Nó gồm{' '}
              <strong>N gen</strong> (N = số cuộc họp). Mỗi <strong>Gen</strong> mã hóa thông tin của
              một cuộc họp: được sắp xếp vào phòng nào, vào giờ nào.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">G</div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Gen (Gene)</div>
                  <div className="text-xs text-slate-500">meetingIndex, roomIndex, timeSlot</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-600">C</div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Chromosome</div>
                  <div className="text-xs text-slate-500">Mảng N gen → 1 phương án lịch họp</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600">P</div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">Population</div>
                  <div className="text-xs text-slate-500">Tập M chromosome → M phương án khác nhau</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Ví dụ Chromosome (5 cuộc họp)</div>
            <div className="space-y-1.5">
              {[
                { meeting: 'Họp BGĐ',       room: 'Phòng B202',    day: 'Thứ Hai', time: '08:00' },
                { meeting: 'Review CNTT',    room: 'Phòng A101',    day: 'Thứ Hai', time: '09:00' },
                { meeting: 'KH Kinh doanh', room: 'Phòng B202',    day: 'Thứ Ba',  time: '10:00' },
                { meeting: 'Nhân sự',        room: 'Phòng C303',    day: 'Thứ Tư',  time: '14:00' },
                { meeting: 'Đào tạo',        room: 'Hội trường',    day: 'Thứ Năm', time: '08:00' },
              ].map((r, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg text-xs bg-emerald-50 border border-emerald-200">
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-mono font-bold flex-shrink-0">{i + 1}</span>
                  <span className="font-medium text-slate-700 w-28 truncate">{r.meeting}</span>
                  <span className="text-slate-500 flex-1">{r.room}</span>
                  <span className="text-slate-400">{r.day} {r.time}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Steps */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-800 text-lg">5 Bước Chính Của Giải Thuật</h2>
        {steps.map((step) => {
          const c = colorMap[step.color];
          return (
            <div key={step.num} className={`rounded-2xl border ${c.border} overflow-hidden`}>
              <div className={`${c.bg} px-6 py-4 flex items-start gap-4`}>
                <div className={`w-10 h-10 rounded-xl ${c.badge} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className={`text-xs font-mono font-bold ${c.text} opacity-60`}>BƯỚC {step.num}</span>
                    <h3 className="font-bold text-slate-800">{step.title}</h3>
                    <span className={`text-xs font-medium ${c.text} hidden sm:block`}>{step.subtitle}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{step.desc}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="px-6 py-4 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                  {step.detail}
                </div>
                <div className={`px-6 py-4 border-t border-l border-slate-100 ${c.codeBg}`}>
                  <pre className="text-xs text-green-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">{step.code}</pre>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">So Sánh Phương Pháp Tìm Kiếm</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Phương pháp</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Độ phức tạp</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">10 họp × 40 slot × 4 phòng</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Chất lượng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-red-50">
                <td className="px-4 py-3 font-medium text-slate-800">Brute Force</td>
                <td className="px-4 py-3 text-slate-600">O((R×T)^N)</td>
                <td className="px-4 py-3 text-red-600 font-mono">~1,7 × 10<sup>18</sup> phương án</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Không khả thi</span></td>
              </tr>
              <tr className="bg-amber-50">
                <td className="px-4 py-3 font-medium text-slate-800">Tham lam (Greedy)</td>
                <td className="px-4 py-3 text-slate-600">O(N × R × T)</td>
                <td className="px-4 py-3 text-amber-600 font-mono">Nhanh, nhưng mất tối ưu cục bộ</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Tạm chấp nhận</span></td>
              </tr>
              <tr className="bg-emerald-50">
                <td className="px-4 py-3 font-medium text-slate-800">Genetic Algorithm</td>
                <td className="px-4 py-3 text-slate-600">O(G × P × N)</td>
                <td className="px-4 py-3 text-emerald-600 font-mono">100 × 50 × 10 = 50.000 đánh giá</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Tối ưu gần đúng</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500">
          G = số thế hệ &nbsp;|&nbsp; P = kích thước quần thể &nbsp;|&nbsp; N = số cuộc họp &nbsp;|&nbsp; R = số phòng &nbsp;|&nbsp; T = số khung giờ
        </div>
      </div>
    </div>
  );
}
