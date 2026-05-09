import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Room = {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  created_at: string;
};

export type Participant = {
  id: string;
  name: string;
  department: string;
  available_slots: number[];
  created_at: string;
};

export type Meeting = {
  id: string;
  title: string;
  priority: number;
  duration_slots: number;
  required_capacity: number;
  participant_ids: string[];
  required_equipment: string[];
  created_at: string;
};

export type ScheduleRun = {
  id: string;
  run_name: string;
  parameters: GAParameters;
  final_fitness: number;
  generations_data: GenerationData[];
  created_at: string;
};

export type ScheduledMeeting = {
  id: string;
  schedule_run_id: string;
  meeting_id: string;
  room_id: string;
  time_slot: number;
  conflicts: number;
  created_at: string;
};

export type GAParameters = {
  generations: number;
  population_size: number;
  crossover_rate: number;
  mutation_rate: number;
  elitism_count: number;
};

export type GenerationData = {
  generation: number;
  best_fitness: number;
  avg_fitness: number;
};
