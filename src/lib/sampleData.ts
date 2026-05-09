import { supabase } from './supabase';
import { TOTAL_SLOTS } from './ga';

export async function clearAndSeedData(): Promise<void> {
  // Clear existing data
  await supabase.from('scheduled_meetings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('schedule_runs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('meetings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert rooms
  const { data: rooms, error: roomsError } = await supabase.from('rooms').insert([
    { name: 'Phòng họp A101', capacity: 10, equipment: ['projector', 'whiteboard'] },
    { name: 'Phòng họp B202', capacity: 20, equipment: ['projector', 'whiteboard', 'video_conf'] },
    { name: 'Phòng họp C303', capacity: 8,  equipment: ['whiteboard'] },
    { name: 'Hội trường lớn', capacity: 50, equipment: ['projector', 'whiteboard', 'video_conf', 'microphone'] },
  ]).select();

  if (roomsError || !rooms) throw new Error('Không thể tạo dữ liệu phòng họp');

  // Insert participants with available slots (most slots free, some blocked)
  const allSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
  const blockSlots = (blocked: number[]) => allSlots.filter(s => !blocked.includes(s));

  const { data: participants, error: partError } = await supabase.from('participants').insert([
    { name: 'Nguyễn Văn An',   department: 'Phòng Giám đốc',  available_slots: blockSlots([0, 1, 16, 17]) },
    { name: 'Trần Thị Bích',   department: 'Phòng Kế toán',   available_slots: blockSlots([8, 9, 24, 25]) },
    { name: 'Lê Minh Cường',   department: 'Phòng CNTT',      available_slots: blockSlots([2, 3, 18, 19]) },
    { name: 'Phạm Thu Dung',   department: 'Phòng Nhân sự',   available_slots: blockSlots([4, 5, 32, 33]) },
    { name: 'Hoàng Văn Em',    department: 'Phòng Marketing',  available_slots: blockSlots([6, 7, 14, 15]) },
    { name: 'Võ Thị Phương',   department: 'Phòng Kinh doanh',available_slots: blockSlots([10, 11, 26, 27]) },
    { name: 'Đinh Quốc Giang', department: 'Phòng CNTT',      available_slots: blockSlots([12, 13, 28, 29]) },
    { name: 'Nguyễn Lan Hương',department: 'Phòng Kế hoạch',  available_slots: blockSlots([20, 21, 36, 37]) },
    { name: 'Bùi Thanh Hùng',  department: 'Phòng Giám đốc',  available_slots: blockSlots([22, 23, 38, 39]) },
    { name: 'Đỗ Thị Kim',      department: 'Phòng Marketing',  available_slots: blockSlots([30, 31, 34, 35]) },
    { name: 'Cao Văn Long',    department: 'Phòng Kinh doanh',available_slots: blockSlots([1, 9, 17, 25]) },
    { name: 'Ngô Bích Ngọc',   department: 'Phòng Nhân sự',   available_slots: blockSlots([3, 11, 19, 27]) },
    { name: 'Trịnh Văn Phúc',  department: 'Phòng Kế hoạch',  available_slots: blockSlots([5, 13, 21, 29]) },
    { name: 'Lưu Thị Quỳnh',   department: 'Phòng Kế toán',   available_slots: blockSlots([7, 15, 23, 31]) },
    { name: 'Hà Đức Sơn',      department: 'Phòng CNTT',      available_slots: blockSlots([0, 8, 16, 24]) },
  ]).select();

  if (partError || !participants) throw new Error('Không thể tạo dữ liệu người tham dự');

  const p = participants;

  // Insert meetings
  const { error: meetError } = await supabase.from('meetings').insert([
    {
      title: 'Họp giao ban tuần — Ban Giám đốc',
      priority: 5,
      duration_slots: 2,
      required_capacity: 8,
      participant_ids: [p[0].id, p[1].id, p[3].id, p[7].id, p[8].id],
      required_equipment: ['projector', 'whiteboard'],
    },
    {
      title: 'Review dự án CNTT Q2',
      priority: 4,
      duration_slots: 3,
      required_capacity: 6,
      participant_ids: [p[2].id, p[6].id, p[14].id, p[0].id],
      required_equipment: ['projector', 'whiteboard'],
    },
    {
      title: 'Họp kế hoạch kinh doanh',
      priority: 4,
      duration_slots: 2,
      required_capacity: 10,
      participant_ids: [p[4].id, p[5].id, p[10].id, p[7].id],
      required_equipment: ['projector'],
    },
    {
      title: 'Tuyển dụng nhân sự mới',
      priority: 3,
      duration_slots: 2,
      required_capacity: 5,
      participant_ids: [p[3].id, p[11].id, p[0].id],
      required_equipment: ['whiteboard'],
    },
    {
      title: 'Đào tạo kỹ năng mềm',
      priority: 2,
      duration_slots: 4,
      required_capacity: 20,
      participant_ids: [p[0].id, p[1].id, p[2].id, p[3].id, p[4].id, p[5].id, p[9].id, p[13].id],
      required_equipment: ['projector', 'whiteboard', 'microphone'],
    },
    {
      title: 'Họp chiến lược marketing',
      priority: 4,
      duration_slots: 2,
      required_capacity: 8,
      participant_ids: [p[4].id, p[9].id, p[0].id, p[7].id],
      required_equipment: ['projector', 'whiteboard'],
    },
    {
      title: 'Kiểm tra tài chính tháng',
      priority: 3,
      duration_slots: 2,
      required_capacity: 5,
      participant_ids: [p[1].id, p[13].id, p[8].id],
      required_equipment: ['whiteboard'],
    },
    {
      title: 'Họp đối tác quốc tế (video)',
      priority: 5,
      duration_slots: 2,
      required_capacity: 10,
      participant_ids: [p[0].id, p[5].id, p[10].id, p[2].id],
      required_equipment: ['projector', 'video_conf'],
    },
    {
      title: 'Xem xét kế hoạch năm',
      priority: 5,
      duration_slots: 3,
      required_capacity: 15,
      participant_ids: [p[0].id, p[1].id, p[2].id, p[3].id, p[4].id, p[7].id, p[12].id],
      required_equipment: ['projector', 'whiteboard'],
    },
    {
      title: 'Sprint planning CNTT',
      priority: 3,
      duration_slots: 2,
      required_capacity: 6,
      participant_ids: [p[2].id, p[6].id, p[14].id],
      required_equipment: ['whiteboard'],
    },
  ]);

  if (meetError) throw new Error('Không thể tạo dữ liệu cuộc họp');
}
