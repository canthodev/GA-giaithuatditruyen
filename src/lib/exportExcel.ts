import * as XLSX from 'xlsx';
import type { Meeting, Room, ScheduledMeeting, Participant } from './supabase';
import { DAYS, SLOTS_PER_DAY, SLOT_TIMES } from './ga';

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: 'Máy chiếu',
  whiteboard: 'Bảng trắng',
  video_conf: 'Video hội nghị',
  microphone: 'Micro',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Rất thấp',
  2: 'Thấp',
  3: 'Trung bình',
  4: 'Cao',
  5: 'Rất cao',
};

type FullScheduledMeeting = ScheduledMeeting & {
  meeting: Meeting;
  room: Room;
};

// Returns "HH:MM" for the slot that ends a meeting (start + duration - 1 slots, then +30min)
function endTime(timeSlot: number, durationSlots: number): string {
  const endSlotIdx = (timeSlot % SLOTS_PER_DAY) + durationSlots;
  // Add 30 min to the last slot's start time
  if (endSlotIdx <= SLOT_TIMES.length) {
    const [h, m] = (SLOT_TIMES[endSlotIdx - 1] ?? '17:00').split(':').map(Number);
    const totalMin = h * 60 + m + 30;
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }
  return '?';
}

// ── Sheet 1: Weekly calendar grid (mirrors the UI calendar view) ──────────────
function buildCalendarSheet(
  scheduledMeetings: FullScheduledMeeting[],
): XLSX.WorkSheet {
  // slotIndex 0-7 per day (morning + afternoon)
  const timeLabels = SLOT_TIMES; // 16 labels for 8 slots AM + 8 slots PM

  // Build lookup: dayIdx -> slotIdx -> meeting
  const grid: Map<string, FullScheduledMeeting> = new Map();
  scheduledMeetings.forEach(sm => {
    const dayIdx = Math.floor(sm.time_slot / SLOTS_PER_DAY);
    const slotIdx = sm.time_slot % SLOTS_PER_DAY;
    for (let s = 0; s < sm.meeting.duration_slots; s++) {
      grid.set(`${dayIdx}-${slotIdx + s}`, sm);
    }
  });

  const aoa: string[][] = [];

  // Header row: "Giờ" + 5 day names
  aoa.push(['Giờ', ...DAYS]);

  // One row per time label (16 rows = 8 AM + 8 PM)
  timeLabels.forEach((label, slotIdx) => {
    const row: string[] = [label];
    DAYS.forEach((_, dayIdx) => {
      const sm = grid.get(`${dayIdx}-${slotIdx}`);
      if (sm) {
        const isStart = sm.time_slot % SLOTS_PER_DAY === slotIdx;
        if (isStart) {
          const start = SLOT_TIMES[sm.time_slot % SLOTS_PER_DAY];
          const end = endTime(sm.time_slot, sm.meeting.duration_slots);
          row.push(`${sm.meeting.title}\n${sm.room.name}\n${start} – ${end}`);
        } else {
          row.push('(tiếp tục)');
        }
      } else {
        row.push('');
      }
    });
    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths
  ws['!cols'] = [{ wch: 8 }, ...DAYS.map(() => ({ wch: 34 }))];

  // Row heights: header + 16 time rows, taller for content rows
  ws['!rows'] = [{ hpt: 20 }, ...timeLabels.map(() => ({ hpt: 52 }))];

  return ws;
}

// ── Sheet 2: Per-participant weekly schedule ──────────────────────────────────
function buildParticipantSheet(
  scheduledMeetings: FullScheduledMeeting[],
  participants: Participant[],
): XLSX.WorkSheet {
  const aoa: (string | number)[][] = [];

  // Header
  aoa.push([
    'Thành viên',
    'Phòng ban',
    'Ngày họp',
    'Tên cuộc họp',
    'Phòng họp',
    'Giờ bắt đầu',
    'Giờ kết thúc',
    'Thời lượng (phút)',
    'Ưu tiên',
    'Thiết bị yêu cầu',
    'Xung đột',
  ]);

  // Sort participants by name
  const sortedParticipants = [...participants].sort((a, b) => a.name.localeCompare(b.name));

  sortedParticipants.forEach(p => {
    // Find all meetings this participant is in
    const myMeetings = scheduledMeetings
      .filter(sm => sm.meeting.participant_ids.includes(p.id))
      .sort((a, b) => a.time_slot - b.time_slot);

    if (myMeetings.length === 0) return;

    myMeetings.forEach((sm, idx) => {
      const dayIdx = Math.floor(sm.time_slot / SLOTS_PER_DAY);
      const slotIdx = sm.time_slot % SLOTS_PER_DAY;
      const start = SLOT_TIMES[slotIdx] ?? '';
      const end = endTime(sm.time_slot, sm.meeting.duration_slots);
      const equipment = sm.meeting.required_equipment
        .map(e => EQUIPMENT_LABELS[e] ?? e)
        .join(', ') || '—';

      aoa.push([
        idx === 0 ? p.name : '',           // Name only on first row for readability
        idx === 0 ? p.department : '',
        DAYS[dayIdx] ?? '',
        sm.meeting.title,
        sm.room.name,
        start,
        end,
        sm.meeting.duration_slots * 30,
        PRIORITY_LABELS[sm.meeting.priority] ?? String(sm.meeting.priority),
        equipment,
        sm.conflicts === 0 ? 'Không' : `${sm.conflicts} xung đột`,
      ]);
    });

    // Blank separator row between participants
    aoa.push(['', '', '', '', '', '', '', '', '', '', '']);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws['!cols'] = [
    { wch: 22 }, // Thành viên
    { wch: 18 }, // Phòng ban
    { wch: 12 }, // Ngày họp
    { wch: 34 }, // Tên cuộc họp
    { wch: 20 }, // Phòng họp
    { wch: 14 }, // Giờ bắt đầu
    { wch: 14 }, // Giờ kết thúc
    { wch: 20 }, // Thời lượng
    { wch: 14 }, // Ưu tiên
    { wch: 30 }, // Thiết bị
    { wch: 14 }, // Xung đột
  ];

  return ws;
}

// ── Public export function ────────────────────────────────────────────────────
export function exportScheduleExcel(
  scheduledMeetings: FullScheduledMeeting[],
  participants: Participant[],
  runName: string,
) {
  const wb = XLSX.utils.book_new();

  const calSheet = buildCalendarSheet(scheduledMeetings);
  XLSX.utils.book_append_sheet(wb, calSheet, 'Lịch Họp Trong Tuần');

  const participantSheet = buildParticipantSheet(scheduledMeetings, participants);
  XLSX.utils.book_append_sheet(wb, participantSheet, 'Lịch Theo Thành Viên');

  const fileName = `lich-hop-${runName.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
