import * as XLSX from 'xlsx';
import type { Meeting, Room, ScheduledMeeting, Participant } from './supabase';
import { slotToLabel, SLOT_TIMES, SLOTS_PER_DAY } from './ga';

const EQUIPMENT_LABELS: Record<string, string> = {
  projector: 'Máy chiếu',
  whiteboard: 'Bảng trắng',
  video_conf: 'Video hội nghị',
  microphone: 'Micro',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: '★☆☆☆☆ Rất thấp',
  2: '★★☆☆☆ Thấp',
  3: '★★★☆☆ Trung bình',
  4: '★★★★☆ Cao',
  5: '★★★★★ Rất cao',
};

type FullScheduledMeeting = ScheduledMeeting & {
  meeting: Meeting;
  room: Room;
};

export function exportScheduleExcel(
  scheduledMeetings: FullScheduledMeeting[],
  participants: Participant[],
  runName: string,
) {
  const participantMap = new Map(participants.map(p => [p.id, p]));

  const endTime = (timeSlot: number, durationSlots: number): string => {
    const endSlotIdx = (timeSlot % SLOTS_PER_DAY) + durationSlots - 1;
    return SLOT_TIMES[endSlotIdx] ?? '?';
  };

  const sorted = [...scheduledMeetings].sort((a, b) => a.time_slot - b.time_slot);

  const rows = sorted.map((sm, idx) => {
    const { day, time } = slotToLabel(sm.time_slot);
    const end = endTime(sm.time_slot, sm.meeting.duration_slots);
    const names = sm.meeting.participant_ids
      .map(id => participantMap.get(id)?.name ?? id)
      .join(', ');
    const equipment = sm.meeting.required_equipment
      .map(e => EQUIPMENT_LABELS[e] ?? e)
      .join(', ');

    return {
      'STT': idx + 1,
      'Tên cuộc họp': sm.meeting.title,
      'Ưu tiên': PRIORITY_LABELS[sm.meeting.priority] ?? sm.meeting.priority,
      'Ngày họp': day,
      'Thời gian bắt đầu': time,
      'Thời gian kết thúc': end,
      'Thời lượng (phút)': sm.meeting.duration_slots * 30,
      'Phòng họp': sm.room.name,
      'Thành viên tham dự': names,
      'Thiết bị yêu cầu': equipment,
      'Xung đột': sm.conflicts === 0 ? 'Không' : `${sm.conflicts} xung đột`,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // STT
    { wch: 36 },  // Tên cuộc họp
    { wch: 22 },  // Ưu tiên
    { wch: 12 },  // Ngày họp
    { wch: 18 },  // Bắt đầu
    { wch: 18 },  // Kết thúc
    { wch: 20 },  // Thời lượng
    { wch: 22 },  // Phòng họp
    { wch: 60 },  // Thành viên
    { wch: 36 },  // Thiết bị
    { wch: 14 },  // Xung đột
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lịch Họp');

  const fileName = `lich-hop-${runName.replace(/\s+/g, '-').toLowerCase()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
