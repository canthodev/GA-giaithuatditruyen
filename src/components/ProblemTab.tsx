import { AlertTriangle, CheckCircle, Target, Users, Calendar, Building2 } from 'lucide-react';

export default function ProblemTab() {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-64 h-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-blue-300 uppercase tracking-widest">Bài Toán Tối Ưu Hóa</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">Xếp Lịch Họp Tối Ưu Cho Cơ Quan</h1>
          <p className="text-slate-300 text-lg max-w-3xl leading-relaxed">
            Bài toán NP-khó: với <strong className="text-white">10 cuộc họp</strong>,{' '}
            <strong className="text-white">4 phòng</strong> và <strong className="text-white">15 người tham dự</strong>,
            không gian tìm kiếm vượt qua <strong className="text-white">10<sup>18</sup></strong> phương án —
            Giải thuật di truyền (GA) giải quyết hiệu quả bằng tiến hóa.
          </p>
        </div>
      </div>

      {/* Problem Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <Building2 className="w-5 h-5 text-blue-500" />,
            label: 'Tài nguyên',
            value: '4 Phòng họp',
            sub: 'Sức chứa 8 – 50 người',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
          },
          {
            icon: <Users className="w-5 h-5 text-emerald-500" />,
            label: 'Nhân sự',
            value: '15 Cán bộ',
            sub: '6 phòng ban khác nhau',
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
          },
          {
            icon: <Calendar className="w-5 h-5 text-amber-500" />,
            label: 'Thời gian',
            value: '40 Khung giờ',
            sub: '5 ngày × 8 slot (30 phút/slot)',
            bg: 'bg-amber-50',
            border: 'border-amber-200',
          },
        ].map((item, i) => (
          <div key={i} className={`rounded-xl border ${item.border} ${item.bg} p-5`}>
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{item.value}</div>
            <div className="text-sm text-slate-500 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Constraints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-bold text-slate-800">Ràng Buộc Cứng (Hard Constraints)</h2>
          </div>
          <div className="p-6 space-y-3">
            {[
              { w: 100, label: 'Không trùng phòng: 2 cuộc họp không được dùng chung phòng cùng giờ' },
              { w: 80, label: 'Không trùng người: Mỗi người chỉ tham dự 1 cuộc họp một lúc' },
              { w: 50, label: 'Đủ sức chứa: Số người ≤ sức chứa phòng' },
              { w: 40, label: 'Không vượt ngày: Cuộc họp phải kết thúc trước 17:30' },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-600">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700">{c.label}</div>
                  <div className="mt-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${c.w}%` }} />
                  </div>
                  <div className="text-xs text-red-500 mt-0.5">Phạt: -{c.w} điểm</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-slate-800">Ràng Buộc Mềm (Soft Constraints)</h2>
          </div>
          <div className="p-6 space-y-3">
            {[
              { w: 20, label: 'Thiết bị phù hợp: Phòng có đầy đủ thiết bị yêu cầu (máy chiếu, video)' },
              { w: 15, label: 'Lịch rảnh người tham dự: Sắp xếp khi mọi người có thể tham dự' },
            ].map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-emerald-600">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700">{c.label}</div>
                  <div className="mt-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${c.w * 5}%` }} />
                  </div>
                  <div className="text-xs text-emerald-500 mt-0.5">Phạt: -{c.w} điểm</div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Hàm mục tiêu (Fitness Function)</div>
              <code className="block text-sm font-mono text-slate-700 leading-relaxed">
                <span className="text-blue-600">fitness</span>(x) = 1000 / (1 + <span className="text-red-500">penalty</span>(x))
                <br />
                <span className="text-slate-400">-- Kết quả: 0 &lt; fitness ≤ 100</span>
                <br />
                <span className="text-slate-400">-- Mục tiêu: fitness → 100</span>
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800">Danh Sách 15 Cán Bộ Tham Dự</h2>
            <p className="text-sm text-slate-500 mt-0.5">Phân bổ theo 6 phòng ban trong cơ quan</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded-full">15 người</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'Nguyễn Văn An',    dept: 'Phòng Giám đốc',  role: 'Giám đốc',          color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
            { name: 'Bùi Thanh Hùng',   dept: 'Phòng Giám đốc',  role: 'Phó Giám đốc',      color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
            { name: 'Trần Thị Bích',    dept: 'Phòng Kế toán',   role: 'Trưởng phòng',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
            { name: 'Lưu Thị Quỳnh',    dept: 'Phòng Kế toán',   role: 'Kế toán viên',      color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
            { name: 'Lê Minh Cường',    dept: 'Phòng CNTT',      role: 'Trưởng phòng',      color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
            { name: 'Đinh Quốc Giang',  dept: 'Phòng CNTT',      role: 'Lập trình viên',    color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
            { name: 'Hà Đức Sơn',       dept: 'Phòng CNTT',      role: 'Kỹ sư hệ thống',   color: 'bg-violet-100 text-violet-700',  dot: 'bg-violet-500' },
            { name: 'Phạm Thu Dung',    dept: 'Phòng Nhân sự',   role: 'Trưởng phòng',      color: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500' },
            { name: 'Ngô Bích Ngọc',    dept: 'Phòng Nhân sự',   role: 'Chuyên viên',       color: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500' },
            { name: 'Hoàng Văn Em',     dept: 'Phòng Marketing', role: 'Trưởng phòng',      color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
            { name: 'Đỗ Thị Kim',       dept: 'Phòng Marketing', role: 'Chuyên viên',       color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500' },
            { name: 'Võ Thị Phương',    dept: 'Phòng Kinh doanh',role: 'Trưởng phòng',      color: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
            { name: 'Cao Văn Long',     dept: 'Phòng Kinh doanh',role: 'Kinh doanh viên',   color: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
            { name: 'Nguyễn Lan Hương', dept: 'Phòng Kế hoạch',  role: 'Trưởng phòng',      color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
            { name: 'Trịnh Văn Phúc',   dept: 'Phòng Kế hoạch',  role: 'Chuyên viên',       color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
          ].map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${p.color}`}>
                {p.name.split(' ').slice(-1)[0][0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-800 text-sm truncate">{p.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.dot}`} />
                  <span className="text-xs text-slate-500 truncate">{p.dept}</span>
                </div>
                <div className="text-xs text-slate-400 truncate">{p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Dữ Liệu Mẫu — Danh Sách Cuộc Họp</h2>
          <p className="text-sm text-slate-500 mt-0.5">10 cuộc họp cần được sắp lịch trong tuần</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Tên cuộc họp</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Ưu tiên</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Thời lượng</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Người tham dự</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Thiết bị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                {
                  title: 'Họp giao ban tuần — BGĐ', priority: 5, dur: '60 phút', eq: 'Máy chiếu, Bảng trắng',
                  attendees: ['Nguyễn Văn An', 'Trần Thị Bích', 'Phạm Thu Dung', 'Nguyễn Lan Hương', 'Bùi Thanh Hùng'],
                },
                {
                  title: 'Review dự án CNTT Q2', priority: 4, dur: '90 phút', eq: 'Máy chiếu, Bảng trắng',
                  attendees: ['Lê Minh Cường', 'Đinh Quốc Giang', 'Hà Đức Sơn', 'Nguyễn Văn An'],
                },
                {
                  title: 'Họp kế hoạch kinh doanh', priority: 4, dur: '60 phút', eq: 'Máy chiếu',
                  attendees: ['Hoàng Văn Em', 'Võ Thị Phương', 'Cao Văn Long', 'Nguyễn Lan Hương'],
                },
                {
                  title: 'Tuyển dụng nhân sự mới', priority: 3, dur: '60 phút', eq: 'Bảng trắng',
                  attendees: ['Phạm Thu Dung', 'Ngô Bích Ngọc', 'Nguyễn Văn An'],
                },
                {
                  title: 'Đào tạo kỹ năng mềm', priority: 2, dur: '120 phút', eq: 'Máy chiếu, Micro',
                  attendees: ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Minh Cường', 'Phạm Thu Dung', 'Hoàng Văn Em', 'Võ Thị Phương', 'Đỗ Thị Kim', 'Lưu Thị Quỳnh'],
                },
                {
                  title: 'Họp chiến lược marketing', priority: 4, dur: '60 phút', eq: 'Máy chiếu, Bảng trắng',
                  attendees: ['Hoàng Văn Em', 'Đỗ Thị Kim', 'Nguyễn Văn An', 'Nguyễn Lan Hương'],
                },
                {
                  title: 'Kiểm tra tài chính tháng', priority: 3, dur: '60 phút', eq: 'Bảng trắng',
                  attendees: ['Trần Thị Bích', 'Lưu Thị Quỳnh', 'Bùi Thanh Hùng'],
                },
                {
                  title: 'Họp đối tác quốc tế', priority: 5, dur: '60 phút', eq: 'Video conf',
                  attendees: ['Nguyễn Văn An', 'Võ Thị Phương', 'Cao Văn Long', 'Lê Minh Cường'],
                },
                {
                  title: 'Xem xét kế hoạch năm', priority: 5, dur: '90 phút', eq: 'Máy chiếu, Bảng trắng',
                  attendees: ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Minh Cường', 'Phạm Thu Dung', 'Hoàng Văn Em', 'Nguyễn Lan Hương', 'Trịnh Văn Phúc'],
                },
                {
                  title: 'Sprint planning CNTT', priority: 3, dur: '60 phút', eq: 'Bảng trắng',
                  attendees: ['Lê Minh Cường', 'Đinh Quốc Giang', 'Hà Đức Sơn'],
                },
              ].map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} className={`w-3 h-3 rounded-sm ${n <= m.priority ? 'bg-amber-400' : 'bg-slate-200'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{m.dur}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.attendees.slice(0, 3).map((name, ai) => (
                        <span key={ai} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-medium">
                          <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                            {name.split(' ').slice(-1)[0][0]}
                          </span>
                          {name.split(' ').slice(-2).join(' ')}
                        </span>
                      ))}
                      {m.attendees.length > 3 && (
                        <span className="inline-flex items-center bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                          +{m.attendees.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{m.eq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
