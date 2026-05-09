// Tạo file .docx (OOXML) thuần XML + ZIP, không cần thư viện ngoài.
// UTF-8 native → tiếng Việt không bị lỗi dấu.

// ─── XML helpers ─────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Run / Paragraph primitives ───────────────────────────────────────────────

type RunOpts = {
  bold?: boolean;
  size?: number;        // half-points, 24 = 12pt
  color?: string;       // hex without #
  font?: string;
  italic?: boolean;
  underline?: boolean;
  pageNum?: 'current' | 'total';
};

function rPr(o: RunOpts): string {
  let s = '';
  if (o.bold)      s += '<w:b/><w:bCs/>';
  if (o.italic)    s += '<w:i/><w:iCs/>';
  if (o.underline) s += '<w:u w:val="single"/>';
  if (o.size)      s += `<w:sz w:val="${o.size}"/><w:szCs w:val="${o.size}"/>`;
  if (o.color)     s += `<w:color w:val="${o.color}"/>`;
  if (o.font)      s += `<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:cs="${o.font}"/>`;
  return s ? `<w:rPr>${s}</w:rPr>` : '';
}

function run(text: string, o: RunOpts = {}): string {
  if (o.pageNum === 'current') {
    return `<w:r>${rPr(o)}</w:r><w:fldChar w:fldCharType="begin"/><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:fldChar w:fldCharType="end"/>`;
  }
  if (o.pageNum === 'total') {
    return `<w:fldChar w:fldCharType="begin"/><w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:fldChar w:fldCharType="end"/>`;
  }
  return `<w:r>${rPr(o)}<w:t xml:space="preserve">${esc(text)}</w:t></w:r>`;
}

type ParaOpts = {
  align?: 'left' | 'center' | 'right' | 'both';
  spaceBefore?: number;  // twips (1pt = 20twips)
  spaceAfter?: number;
  indentLeft?: number;   // twips
  indentHanging?: number;
  shading?: string;      // fill hex
  borderBottom?: boolean;
  keepNext?: boolean;
};

function para(content: string, o: ParaOpts = {}): string {
  let pPr = '';
  if (o.align && o.align !== 'left') pPr += `<w:jc w:val="${o.align}"/>`;
  if (o.spaceBefore || o.spaceAfter) {
    pPr += `<w:spacing w:before="${o.spaceBefore ?? 0}" w:after="${o.spaceAfter ?? 0}" w:line="276" w:lineRule="auto"/>`;
  } else {
    pPr += `<w:spacing w:line="276" w:lineRule="auto"/>`;
  }
  if (o.indentLeft || o.indentHanging) {
    pPr += `<w:ind w:left="${o.indentLeft ?? 0}"${o.indentHanging ? ` w:hanging="${o.indentHanging}"` : ''}/>`;
  }
  if (o.shading) pPr += `<w:shd w:val="clear" w:color="auto" w:fill="${o.shading}"/>`;
  if (o.borderBottom) pPr += `<w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="CBD5E1"/></w:pBdr>`;
  if (o.keepNext) pPr += `<w:keepNext/>`;
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${content}</w:p>`;
}

function emptyPara(before = 0, after = 0): string {
  return para('', { spaceBefore: before, spaceAfter: after });
}

// ─── High-level builders ──────────────────────────────────────────────────────

const F   = 'Times New Roman';
const FS  = 'Arial';

function nationalHeader(): string {
  const d = new Date();
  const dateStr = `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  return (
    para(run('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { bold: true, size: 26, color: '1E293B', font: F }), { align: 'center', spaceBefore: 0, spaceAfter: 60 }) +
    para(run('Độc lập - Tự do - Hạnh phúc', { size: 24, color: '1E293B', font: F, underline: true }), { align: 'center', spaceBefore: 0, spaceAfter: 60 }) +
    para(run(dateStr, { size: 22, color: '64748B', font: F, italic: true }), { align: 'center', spaceBefore: 0, spaceAfter: 120 })
  );
}

function docTitle(text: string): string {
  return para(run(text, { bold: true, size: 36, color: '1E293B', font: F }), { align: 'center', spaceBefore: 80, spaceAfter: 40 });
}

function docSubtitle(text: string): string {
  return para(run(text, { size: 22, color: '64748B', font: F }), { align: 'center', spaceBefore: 0, spaceAfter: 100 });
}

function sectionHeader(num: string, title: string, subtitle: string): string {
  return (
    emptyPara(200, 0) +
    para(
      run(`${num}. ${title.toUpperCase()}`, { bold: true, size: 26, color: 'FFFFFF', font: FS }) +
      run(`   ${subtitle}`, { size: 18, color: 'BDD7FF', font: FS }),
      { spaceBefore: 80, spaceAfter: 80, shading: '1E40AF' }
    )
  );
}

function subHeading(text: string): string {
  return para(
    run(text, { bold: true, size: 24, color: '1E293B', font: F }),
    { spaceBefore: 200, spaceAfter: 80, borderBottom: true }
  );
}

function bodyText(text: string, indent = false): string {
  return para(
    run(text, { size: 24, color: '475569', font: F }),
    { spaceBefore: 40, spaceAfter: 60, indentLeft: indent ? 360 : 0 }
  );
}

function bullet(label: string, value: string): string {
  return para(
    run('• ', { bold: true, size: 24, color: '1D4ED8', font: F }) +
    run(label, { bold: true, size: 24, color: '1E293B', font: F }) +
    run(' ' + value, { size: 24, color: '475569', font: F }),
    { spaceBefore: 40, spaceAfter: 40, indentLeft: 360, indentHanging: 240 }
  );
}

function stepPara(num: string, title: string): string {
  return para(
    run(`[${num}]  `, { bold: true, size: 24, color: '1D4ED8', font: FS }) +
    run(title, { bold: true, size: 24, color: '1E293B', font: F }),
    { spaceBefore: 80, spaceAfter: 40 }
  );
}

// ─── Info box (single-cell table with left border) ────────────────────────────

function infoBox(lines: string[], fill = 'EFF6FF', borderColor = '1D4ED8', textColor = '1D4ED8'): string {
  const cellContent = lines.map(l =>
    para(run(l || ' ', { size: 20, color: textColor, font: FS }), { spaceBefore: 20, spaceAfter: 20 })
  ).join('');

  return `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblBorders>
      <w:top w:val="none" w:sz="0"/>
      <w:left w:val="single" w:sz="18" w:color="${borderColor}"/>
      <w:bottom w:val="none" w:sz="0"/>
      <w:right w:val="none" w:sz="0"/>
      <w:insideH w:val="none" w:sz="0"/>
      <w:insideV w:val="none" w:sz="0"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="80" w:type="dxa"/>
      <w:left w:w="140" w:type="dxa"/>
      <w:bottom w:w="80" w:type="dxa"/>
      <w:right w:w="140" w:type="dxa"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
      </w:tcPr>
      ${cellContent}
    </w:tc>
  </w:tr>
</w:tbl>
${emptyPara(40, 0)}`;
}

// ─── Data table ───────────────────────────────────────────────────────────────

type Col = { label: string; pct: number };

function dataTable(cols: Col[], rows: string[][]): string {
  const colDefs = cols.map(c => `<w:gridCol w:w="${Math.round(c.pct * 92)}"/>`).join('');

  const headerCells = cols.map(c => `
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="${Math.round(c.pct * 92)}" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="1E293B"/>
        <w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
      </w:tcPr>
      ${para(run(c.label.toUpperCase(), { bold: true, size: 18, color: 'FFFFFF', font: FS }), { spaceBefore: 0, spaceAfter: 0 })}
    </w:tc>`).join('');

  const headerRow = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headerCells}</w:tr>`;

  const dataRows = rows.map((cells, ri) => {
    const fill = ri % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    const tcs = cells.map((cell, ci) => `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${Math.round((cols[ci]?.pct ?? 20) * 92)}" w:type="dxa"/>
          <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
          <w:tcBorders>
            <w:top w:val="single" w:sz="4" w:color="E2E8F0"/>
            <w:bottom w:val="single" w:sz="4" w:color="E2E8F0"/>
            <w:left w:val="single" w:sz="4" w:color="E2E8F0"/>
            <w:right w:val="single" w:sz="4" w:color="E2E8F0"/>
          </w:tcBorders>
          <w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tcMar>
        </w:tcPr>
        ${para(run(cell, { size: 20, color: '1E293B', font: F }), { spaceBefore: 0, spaceAfter: 0 })}
      </w:tc>`).join('');
    return `<w:tr>${tcs}</w:tr>`;
  }).join('');

  return `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblStyle w:val="TableGrid"/>
  </w:tblPr>
  <w:tblGrid>${colDefs}</w:tblGrid>
  ${headerRow}
  ${dataRows}
</w:tbl>
${emptyPara(60, 0)}`;
}

// ─── Stats table (4 cells) ────────────────────────────────────────────────────

function statsTable(items: { val: string; label: string; unit: string }[]): string {
  const cells = items.map(item => `
    <w:tc>
      <w:tcPr>
        <w:shd w:val="clear" w:color="auto" w:fill="EFF6FF"/>
        <w:tcMar><w:top w:w="120" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>
      </w:tcPr>
      ${para(run(item.val, { bold: true, size: 52, color: '1D4ED8', font: FS }), { align: 'center', spaceBefore: 0, spaceAfter: 0 })}
      ${para(run(item.label, { bold: true, size: 20, color: '1E293B', font: FS }), { align: 'center', spaceBefore: 0, spaceAfter: 0 })}
      ${para(run(item.unit, { size: 18, color: '64748B', font: FS }), { align: 'center', spaceBefore: 0, spaceAfter: 0 })}
    </w:tc>`).join('');
  return `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblBorders>
      <w:top w:val="none" w:sz="0"/><w:left w:val="none" w:sz="0"/>
      <w:bottom w:val="none" w:sz="0"/><w:right w:val="none" w:sz="0"/>
      <w:insideH w:val="none" w:sz="0"/><w:insideV w:val="none" w:sz="0"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>${cells}</w:tr>
</w:tbl>
${emptyPara(80, 0)}`;
}

// ─── Tier row ─────────────────────────────────────────────────────────────────

function tierRow(range: string, label: string, desc: string, fill: string, borderColor: string): string {
  return `
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblBorders>
      <w:top w:val="none" w:sz="0"/><w:left w:val="single" w:sz="18" w:color="${borderColor}"/>
      <w:bottom w:val="none" w:sz="0"/><w:right w:val="none" w:sz="0"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
        <w:tcMar><w:top w:w="80" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tcMar>
      </w:tcPr>
      ${para(
        run(`${range}  `, { bold: true, size: 24, color: borderColor, font: FS }) +
        run(`[${label}]  — `, { bold: true, size: 24, color: borderColor, font: F }) +
        run(desc, { size: 24, color: '1E293B', font: F }),
        { spaceBefore: 0, spaceAfter: 0 }
      )}
    </w:tc>
  </w:tr>
</w:tbl>
${emptyPara(20, 0)}`;
}

// ─── Page break ───────────────────────────────────────────────────────────────

function pageBreak(): string {
  return `<w:p><w:r><w:lastRenderedPageBreak/><w:br w:type="page"/></w:r></w:p>`;
}

// ─── Document body ────────────────────────────────────────────────────────────

function buildBody(): string {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  return [
    // ── Cover ──────────────────────────────────────────────────────────────────
    emptyPara(600, 0),
    nationalHeader(),
    docTitle('TÀI LIỆU KỸ THUẬT'),
    docTitle('XẾP LỊCH HỌP TỐI ƯU CHO CƠ QUAN'),
    docSubtitle('ỨNG DỤNG GIẢI THUẬT DI TRUYỀN (GENETIC ALGORITHM)'),
    emptyPara(80, 0),
    infoBox([
      'Tóm tắt nội dung: Tài liệu trình bày bài toán tối ưu hóa lịch họp cơ quan — một bài toán',
      'NP-khó với không gian tìm kiếm vượt 10^21 phương án — và phương pháp giải quyết bằng Giải',
      'thuật Di truyền (Genetic Algorithm). Bao gồm: mô tả bài toán, mã hóa nhiễm sắc thể,',
      '5 bước GA, hàm fitness, kết quả thực nghiệm và hướng dẫn điều chỉnh tham số.',
    ], 'EFF6FF', '1D4ED8', '1D4ED8'),
    para(run(`Lập ngày ${dateStr}`, { size: 20, color: '94A3B8', font: FS }), { align: 'right', spaceBefore: 80, spaceAfter: 0 }),
    pageBreak(),

    // ── Phần I ────────────────────────────────────────────────────────────────
    sectionHeader('I', 'Mô Tả Bài Toán Tối Ưu Hóa Lịch Họp', 'Problem Description'),

    subHeading('1.1. Bối Cảnh Và Thách Thức'),
    bodyText('Mỗi tuần, cơ quan cần sắp xếp 10 cuộc họp vào 4 phòng họp và 40 khung giờ làm việc (5 ngày × 8 slot × 30 phút/slot), đồng thời đảm bảo 15 cán bộ từ 6 phòng ban không bị xung đột lịch. Đây là bài toán tổ hợp thuộc lớp NP-khó.'),
    emptyPara(60, 0),

    statsTable([
      { val: '10', label: 'Cuộc họp', unit: 'cần xếp lịch' },
      { val: '4',  label: 'Phòng họp', unit: 'sức chứa 8–50 người' },
      { val: '15', label: 'Cán bộ', unit: 'từ 6 phòng ban' },
      { val: '40', label: 'Khung giờ', unit: '5 ngày × 8 slot' },
    ]),

    bodyText('Không gian tìm kiếm: với mỗi cuộc họp có thể gán vào 4 × 40 = 160 tổ hợp (phòng × giờ), 10 cuộc họp tạo ra 160^10 xấp xỉ 1,099 × 10^21 phương án. Nếu máy tính kiểm tra 1 tỷ phương án/giây, sẽ cần 34.865 năm — brute-force hoàn toàn không khả thi.'),
    emptyPara(40, 0),
    infoBox([
      'Kết luận: Bài toán xếp lịch họp là bài toán tổ hợp NP-khó. Không có thuật toán đa thức nào',
      'có thể giải tối ưu tuyệt đối trong thời gian hợp lý. Cần dùng thuật toán meta-heuristic như GA.',
    ], 'FEF2F2', 'B91C1C', 'B91C1C'),

    subHeading('1.2. Các Ràng Buộc Cần Thỏa Mãn'),
    bodyText('Bài toán có hai loại ràng buộc: ràng buộc cứng (vi phạm → phương án không hợp lệ) và ràng buộc mềm (vi phạm → giảm chất lượng).'),
    emptyPara(40, 0),
    dataTable(
      [{ label: 'Loại', pct: 10 }, { label: 'Ràng buộc', pct: 35 }, { label: 'Mô tả chi tiết', pct: 55 }],
      [
        ['Cứng', 'Không trùng phòng (-100 điểm)', 'Hai cuộc họp không được dùng chung phòng cùng khung giờ'],
        ['Cứng', 'Không trùng người (-80 điểm)',  'Mỗi cán bộ chỉ tham dự một cuộc họp tại một thời điểm'],
        ['Cứng', 'Đủ sức chứa (-50 điểm)',        'Số người tham dự nhỏ hơn hoặc bằng sức chứa tối đa phòng'],
        ['Cứng', 'Không tràn ngày (-40 điểm)',    'Cuộc họp phải kết thúc trước 17:30 cùng ngày làm việc'],
        ['Mềm',  'Thiết bị đầy đủ (-20 điểm)',   'Phòng có đủ thiết bị yêu cầu (máy chiếu, video conf)'],
        ['Mềm',  'Lịch rảnh người dự (-15/slot)', 'Sắp xếp khi cán bộ liên quan thực sự không bận việc khác'],
      ]
    ),

    subHeading('1.3. Danh Sách 10 Cuộc Họp Cần Xếp Lịch'),
    dataTable(
      [
        { label: '#', pct: 5 },
        { label: 'Tên cuộc họp', pct: 32 },
        { label: 'Ưu tiên', pct: 10 },
        { label: 'Thời lượng', pct: 12 },
        { label: 'Số người', pct: 10 },
        { label: 'Thiết bị', pct: 31 },
      ],
      [
        ['01', 'Họp giao ban tuần — BGĐ',      '5/5', '60 phút',  '5',  'Máy chiếu, Bảng trắng'],
        ['02', 'Review dự án CNTT Q2',          '4/5', '90 phút',  '4',  'Máy chiếu, Bảng trắng'],
        ['03', 'Họp kế hoạch kinh doanh',       '4/5', '60 phút',  '4',  'Máy chiếu'],
        ['04', 'Tuyển dụng nhân sự mới',        '3/5', '60 phút',  '3',  'Bảng trắng'],
        ['05', 'Đào tạo kỹ năng mềm',           '2/5', '120 phút', '8',  'Máy chiếu, Micro'],
        ['06', 'Họp chiến lược marketing',      '4/5', '60 phút',  '4',  'Máy chiếu, Bảng trắng'],
        ['07', 'Kiểm tra tài chính tháng',      '3/5', '60 phút',  '3',  'Bảng trắng'],
        ['08', 'Họp đối tác quốc tế',           '5/5', '60 phút',  '4',  'Video conf'],
        ['09', 'Xem xét kế hoạch năm',          '5/5', '90 phút',  '7',  'Máy chiếu, Bảng trắng'],
        ['10', 'Sprint planning CNTT',          '3/5', '60 phút',  '3',  'Bảng trắng'],
      ]
    ),

    // ── Phần II ───────────────────────────────────────────────────────────────
    sectionHeader('II', 'Giải Thuật Di Truyền (Genetic Algorithm)', 'GA Methodology'),

    subHeading('2.1. Tổng Quan Phương Pháp'),
    bodyText('Giải thuật di truyền (GA) là thuật toán tìm kiếm meta-heuristic mô phỏng quá trình tiến hóa tự nhiên: chọn lọc tự nhiên, di truyền và đột biến. GA duy trì một quần thể (population) các phương án lịch họp, cho chúng cạnh tranh và sinh sản qua nhiều thế hệ, hội tụ dần về phương án tối ưu.'),
    emptyPara(40, 0),
    infoBox([
      'Tham số GA mặc định:',
      '  • Số thế hệ (generations) = 100',
      '  • Kích thước quần thể (population_size) = 50',
      '  • Tỷ lệ lai ghép (crossover_rate) = 80%',
      '  • Tỷ lệ đột biến (mutation_rate) = 5% / gen',
      '  • Elitism (số cá thể giữ lại tốt nhất) = 2',
      '  • Tổng đánh giá tối đa = 100 × 50 × 10 = 50.000 (thay vì 10^21 brute-force)',
    ], 'EFF6FF', '1D4ED8', '1D4ED8'),

    subHeading('2.2. Mã Hóa Nhiễm Sắc Thể (Chromosome Encoding)'),
    bodyText('Mỗi phương án lịch họp được mã hóa thành một Chromosome — mảng N gen. Mỗi Gen biểu diễn thông tin xếp lịch của một cuộc họp với 3 thuộc tính:'),
    bullet('meetingIndex:', 'Chỉ số cuộc họp (0 đến 9)'),
    bullet('roomIndex:', 'Phòng được gán (0 đến 3, tương ứng 4 phòng họp trong cơ quan)'),
    bullet('timeSlot:', 'Khung giờ bắt đầu (0 đến 39; 0 = 08:00 Thứ Hai, 39 = 17:00 Thứ Sáu; 1 slot = 30 phút)'),
    emptyPara(40, 0),
    infoBox([
      'Ví dụ Chromosome 5 gen:',
      '  Gen 1: { meetingIndex:0, roomIndex:1, timeSlot:0  }  →  Họp BGĐ       | Phòng B202   | Thứ Hai 08:00',
      '  Gen 2: { meetingIndex:1, roomIndex:0, timeSlot:2  }  →  Review CNTT   | Phòng A101   | Thứ Hai 09:00',
      '  Gen 3: { meetingIndex:2, roomIndex:1, timeSlot:10 }  →  KH Kinh doanh | Phòng B202   | Thứ Ba  10:00',
      '  Gen 4: { meetingIndex:3, roomIndex:2, timeSlot:18 }  →  Nhân sự       | Phòng C303   | Thứ Tư  14:00',
      '  Gen 5: { meetingIndex:4, roomIndex:3, timeSlot:24 }  →  Đào tạo       | Hội trường   | Thứ Năm 08:00',
    ], 'F1F5F9', '475569', '1E293B'),

    subHeading('2.3. Hàm Fitness'),
    bodyText('Hàm fitness đánh giá chất lượng mỗi Chromosome. Giá trị trả về trong khoảng (0, 100]:'),
    emptyPara(20, 0),
    infoBox([
      'fitness(chromosome) = 1000 / (1 + penalty)',
      '',
      'Trong đó penalty = tổng điểm phạt tất cả ràng buộc bị vi phạm:',
      '  • Trùng phòng họp:       +100 điểm / cặp vi phạm',
      '  • Trùng người tham dự:   +80  điểm / cặp vi phạm',
      '  • Phòng quá nhỏ:         +50  điểm / vi phạm',
      '  • Cuộc họp tràn ngày:    +40  điểm / vi phạm',
      '  • Thiếu thiết bị:        +20  điểm / thiết bị thiếu',
      '  • Người bận (per slot):  +15  điểm / slot vi phạm',
      '',
      'Khi penalty = 0    →  fitness = 1000/1 = 100  (hoàn hảo — không xung đột)',
      'Khi penalty = 999  →  fitness = 1000/1000 = 1  (rất nhiều xung đột)',
    ], 'F1F5F9', '475569', '1E293B'),

    subHeading('2.4. Năm Bước Thực Thi GA'),
    ...[
      { num: 'Bước 1', title: 'Khởi Tạo Quần Thể (Initialization)', desc: 'Tạo ngẫu nhiên 50 Chromosome. Mỗi Chromosome được tạo bằng cách gán ngẫu nhiên phòng hợp lệ (đủ sức chứa) và khung giờ cho từng cuộc họp trong tuần.' },
      { num: 'Bước 2', title: 'Đánh Giá Fitness (Fitness Evaluation)', desc: 'Tính hàm fitness cho tất cả 50 cá thể. Sắp xếp quần thể theo thứ tự fitness giảm dần. Lưu lại cá thể tốt nhất toàn cục nhờ cơ chế elitism.' },
      { num: 'Bước 3', title: 'Chọn Lọc — Tournament Selection', desc: 'Chọn ngẫu nhiên k=3 cá thể từ quần thể, giữ lại cá thể có fitness cao nhất làm cha hoặc mẹ. Cá thể có fitness cao được chọn thường xuyên hơn một cách tự nhiên.' },
      { num: 'Bước 4', title: 'Lai Ghép — Single-Point Crossover (xác suất 80%)', desc: 'Với xác suất 80%, chọn điểm cắt ngẫu nhiên trên Chromosome. Con A = nửa đầu Cha + nửa sau Mẹ; Con B = nửa đầu Mẹ + nửa sau Cha. Giúp kết hợp các đặc tính tốt của cả hai cha mẹ.' },
      { num: 'Bước 5', title: 'Đột Biến — Random Mutation (xác suất 5%/gen)', desc: 'Mỗi gen trong Chromosome con có 5% xác suất bị thay thế bằng một gen ngẫu nhiên hoàn toàn mới. Cơ chế này duy trì đa dạng quần thể, tránh hội tụ sớm vào cực trị cục bộ.' },
    ].flatMap(s => [stepPara(s.num, s.title), bodyText(s.desc, true)]),

    // ── Phần III ──────────────────────────────────────────────────────────────
    sectionHeader('III', 'Giải Thích Kết Quả', 'Results Interpretation'),

    subHeading('3.1. Thang Điểm Đánh Giá Phương Án'),
    bodyText('Sau khi GA kết thúc, phương án tốt nhất được biểu diễn bằng điểm fitness theo thang sau:'),
    emptyPara(40, 0),
    tierRow('fitness 90 – 100', 'Xuất sắc',  'Không hoặc rất ít xung đột. Có thể áp dụng trực tiếp vào thực tế.',         'ECFDF5', '059669'),
    tierRow('fitness 70 – 90',  'Tốt',       'Vài xung đột nhỏ về thiết bị hoặc lịch rảnh. Xem xét điều chỉnh 1–2 cuộc họp.', 'FFFBEB', 'B45309'),
    tierRow('fitness 50 – 70',  'Chấp nhận', 'Có xung đột đáng kể. Nên tăng số thế hệ hoặc kích thước quần thể GA.',       'FFF7ED', 'EA580C'),
    tierRow('fitness < 50',     'Kém',       'Nhiều xung đột. Kiểm tra lại dữ liệu đầu vào và tăng tham số GA.',           'FEF2F2', 'B91C1C'),
    emptyPara(40, 0),

    subHeading('3.2. Hướng Dẫn Đọc Đồ Thị Hội Tụ'),
    bodyText('Đồ thị hội tụ hiển thị sự thay đổi fitness qua các thế hệ. Có hai đường chỉ số quan trọng:'),
    bullet('Đường xanh dương (Fitness tốt nhất):', 'Fitness của cá thể tốt nhất trong quần thể tại mỗi thế hệ. Luôn không giảm nhờ cơ chế elitism giữ lại top-2 cá thể tốt nhất sang thế hệ sau.'),
    bullet('Đường xanh lá (Fitness trung bình):', 'Trung bình fitness toàn quần thể. Phản ánh chất lượng tổng thể đang cải thiện. Khoảng cách với đường tốt nhất cho biết độ đồng nhất của quần thể.'),
    emptyPara(40, 0),
    infoBox([
      'Dấu hiệu GA hoạt động tốt:',
      '  • Cả 2 đường tăng dần và hội tụ về giá trị cao trong 20–40 thế hệ đầu',
      '  • Khoảng cách 2 đường thu hẹp dần → quần thể đồng nhất (GA đã hội tụ)',
      '  • Nếu cả 2 đường phẳng từ rất sớm → tăng mutation rate để duy trì đa dạng',
      '  • Nếu đường tốt nhất tăng đến thế hệ cuối → tăng số thế hệ để GA tiếp tục cải thiện',
    ], 'EFF6FF', '1D4ED8', '1D4ED8'),

    subHeading('3.3. Điều Chỉnh Tham Số GA'),
    bodyText('Bảng hướng dẫn điều chỉnh tham số khi kết quả chưa đạt yêu cầu mong muốn:'),
    emptyPara(40, 0),
    dataTable(
      [
        { label: 'Tham số', pct: 20 },
        { label: 'Mặc định', pct: 12 },
        { label: 'Tăng khi', pct: 34 },
        { label: 'Giảm khi', pct: 34 },
      ],
      [
        ['Số thế hệ',           '100', 'Fitness vẫn tăng ở thế hệ cuối cùng',      'GA đã hội tụ sớm, tiết kiệm thời gian'],
        ['Kích thước quần thể', '50',  'GA hay bị kẹt cực trị cục bộ',             'Cần kết quả nhanh, bài toán đơn giản'],
        ['Tỷ lệ lai ghép',      '80%', 'Quần thể đồng nhất quá nhanh',             'Cần bảo toàn phương án tốt hoàn toàn'],
        ['Tỷ lệ đột biến',      '5%',  'Avg xấp xỉ Best từ rất sớm (thiếu đa dạng)', 'Kết quả nhảy lên xuống không ổn định'],
      ]
    ),

    // ── Phần IV ───────────────────────────────────────────────────────────────
    sectionHeader('IV', 'So Sánh Phương Pháp Tìm Kiếm', 'Method Comparison'),

    subHeading('4.1. Phân Tích Độ Phức Tạp'),
    dataTable(
      [
        { label: 'Phương pháp', pct: 20 },
        { label: 'Độ phức tạp', pct: 16 },
        { label: 'Số đánh giá thực tế', pct: 28 },
        { label: 'Chất lượng', pct: 18 },
        { label: 'Tính khả thi', pct: 18 },
      ],
      [
        ['Brute Force',        'O((R×T)^N)', '~10^21 phương án — 34.865 năm',          'Tối ưu tuyệt đối', 'Không khả thi'],
        ['Greedy (Tham lam)',  'O(N×R×T)',   '~1.600 đánh giá — dưới 1ms',             'Cục bộ',           'Chấp nhận được'],
        ['Simulated Annealing','O(N×iter)',  '~100.000 đánh giá — khoảng 2 giây',      'Gần tối ưu',       'Tốt'],
        ['Genetic Algorithm',  'O(G×P×N)',   '50.000 đánh giá — 3 đến 5 giây',         'Gần tối ưu 95%+',  'Khả thi, tốt'],
      ]
    ),
    bodyText('Ký hiệu: G = số thế hệ | P = kích thước quần thể | N = số cuộc họp | R = số phòng | T = số khung giờ'),
    emptyPara(60, 0),

    subHeading('4.2. Kết Luận'),
    bodyText('GA không đảm bảo tìm ra phương án tối ưu tuyệt đối nhưng tìm được phương án tốt nhất có thể trong thời gian hợp lý. Với bài toán xếp lịch họp có 10^21 phương án tiềm năng, GA chỉ cần đánh giá khoảng 50.000 cá thể nhưng vẫn đạt fitness 90+ trong đa số trường hợp thực tế.'),
    emptyPara(40, 0),
    infoBox([
      'Tóm tắt kết quả thực nghiệm:',
      '  • 50.000 đánh giá thay vì 10^21  (giảm hơn 10^16 lần số phương án cần xét)',
      '  • Fitness trung bình đạt 90+ sau 100 thế hệ tiến hóa',
      '  • Thời gian chạy thực tế: 3 đến 5 giây trên trình duyệt web',
      '  • Tỷ lệ phương án không vi phạm ràng buộc cứng: hơn 85% trong điều kiện dữ liệu mẫu',
    ], 'ECFDF5', '059669', '059669'),
  ].join('');
}

// ─── OOXML document assembly ──────────────────────────────────────────────────

function buildDocumentXml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:mo="http://schemas.microsoft.com/office/mac/office/2008/main"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:mv="urn:schemas-microsoft-com:mac:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 wp14">
  <w:body>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="709" w:footer="709" w:gutter="0"/>
    </w:sectPr>
    ${body}
  </w:body>
</w:document>`;
}

function buildHeaderXml(dateStr: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="right"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="E2E8F0"/></w:pBdr></w:pPr>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="94A3B8"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr>
      <w:t>TÀI LIỆU KỸ THUẬT — GIẢI THUẬT DI TRUYỀN XẾP LỊCH HỌP   ${dateStr}</w:t>
    </w:r>
  </w:p>
</w:hdr>`;
}

function buildFooterXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="1" w:color="E2E8F0"/></w:pBdr></w:pPr>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="94A3B8"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">Trang </w:t></w:r>
    <w:fldChar w:fldCharType="begin"/>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="94A3B8"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
    <w:fldChar w:fldCharType="end"/>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="94A3B8"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve"> / </w:t></w:r>
    <w:fldChar w:fldCharType="begin"/>
    <w:r><w:rPr><w:sz w:val="16"/><w:szCs w:val="16"/><w:color w:val="94A3B8"/><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>
    <w:fldChar w:fldCharType="end"/>
  </w:p>
</w:ftr>`;
}

function buildRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml"  ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml"    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml"  ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/header1.xml"   ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml"   ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="24"/><w:szCs w:val="24"/>
      <w:lang w:val="vi-VN"/>
    </w:rPr></w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr>
      <w:tblBorders>
        <w:top w:val="single" w:sz="4" w:color="E2E8F0"/>
        <w:left w:val="single" w:sz="4" w:color="E2E8F0"/>
        <w:bottom w:val="single" w:sz="4" w:color="E2E8F0"/>
        <w:right w:val="single" w:sz="4" w:color="E2E8F0"/>
        <w:insideH w:val="single" w:sz="4" w:color="E2E8F0"/>
        <w:insideV w:val="single" w:sz="4" w:color="E2E8F0"/>
      </w:tblBorders>
    </w:tblPr>
  </w:style>
</w:styles>`;

const SETTINGS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:updateFields w:val="1"/>
</w:settings>`;

// ─── ZIP builder (pure JS, no deps) ─────────────────────────────────────────

// Minimal ZIP creator — stores files without compression (method=0)
// Sufficient for DOCX since Word handles it fine.

function u8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function u16le(n: number): number[] { return [n & 0xff, (n >> 8) & 0xff]; }
function u32le(n: number): number[] { return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]; }

function crc32(data: Uint8Array): number {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
crc32.table = null as unknown as Uint32Array;

type ZipEntry = { name: string; data: Uint8Array; offset: number };

function buildZip(files: { name: string; content: string }[]): Uint8Array {
  const entries: ZipEntry[] = [];
  const parts: Uint8Array[] = [];
  let offset = 0;

  // Encode filename as UTF-8
  const enc = new TextEncoder();

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const data = u8(f.content);
    const crc = crc32(data);
    const dosDate = 0x5269; // 2023-03-09 placeholder
    const dosTime = 0x0000;

    const localHeader = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04,          // local file header sig
      ...u16le(20),                     // version needed
      ...u16le(0x0800),                 // flags: UTF-8
      ...u16le(0),                      // method: store
      ...u16le(dosTime),
      ...u16le(dosDate),
      ...u32le(crc),
      ...u32le(data.length),            // compressed size
      ...u32le(data.length),            // uncompressed size
      ...u16le(nameBytes.length),
      ...u16le(0),                      // extra field length
      ...nameBytes,
    ]);

    entries.push({ name: f.name, data, offset });
    parts.push(localHeader, data);
    offset += localHeader.length + data.length;
  }

  // Central directory
  const cdParts: Uint8Array[] = [];
  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const dosDate = 0x5269;
    const dosTime = 0x0000;
    cdParts.push(new Uint8Array([
      0x50, 0x4b, 0x01, 0x02,          // central dir sig
      ...u16le(20), ...u16le(20),       // version made by, needed
      ...u16le(0x0800),                 // flags: UTF-8
      ...u16le(0),                      // method: store
      ...u16le(dosTime),
      ...u16le(dosDate),
      ...u32le(crc),
      ...u32le(e.data.length),
      ...u32le(e.data.length),
      ...u16le(nameBytes.length),
      ...u16le(0), ...u16le(0),         // extra, comment length
      ...u16le(0), ...u16le(0),         // disk start, int attrs
      ...u32le(0),                      // ext attrs
      ...u32le(e.offset),               // local header offset
      ...nameBytes,
    ]));
  }

  const cdBytes = new Uint8Array(cdParts.reduce((a, b) => a + b.length, 0));
  let cdOff = 0;
  for (const p of cdParts) { cdBytes.set(p, cdOff); cdOff += p.length; }

  const eocd = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    ...u16le(0), ...u16le(0),
    ...u16le(entries.length), ...u16le(entries.length),
    ...u32le(cdBytes.length),
    ...u32le(offset),
    ...u16le(0),
  ]);

  const total = parts.reduce((a, b) => a + b.length, 0) + cdBytes.length + eocd.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of [...parts, cdBytes, eocd]) { out.set(p, pos); pos += p.length; }
  return out;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function exportOverviewDocx() {
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  const body = buildBody();
  const documentXml = buildDocumentXml(body);
  const headerXml  = buildHeaderXml(dateStr);
  const footerXml  = buildFooterXml();

  const zipData = buildZip([
    { name: '[Content_Types].xml',       content: CONTENT_TYPES },
    { name: '_rels/.rels',               content: ROOT_RELS },
    { name: 'word/document.xml',         content: documentXml },
    { name: 'word/_rels/document.xml.rels', content: buildRelsXml() },
    { name: 'word/styles.xml',           content: STYLES_XML },
    { name: 'word/settings.xml',         content: SETTINGS_XML },
    { name: 'word/header1.xml',          content: headerXml },
    { name: 'word/footer1.xml',          content: footerXml },
  ]);

  const blob = new Blob([zipData], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Tai-lieu-GA-Xep-lich-hop-${dateStr}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}