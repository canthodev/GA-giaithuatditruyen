/*
  # GA Meeting Scheduler Tables

  ## Overview
  Creates all necessary tables for the Genetic Algorithm Meeting Scheduler application.

  ## New Tables

  ### rooms
  - id: uuid primary key
  - name: room name (e.g., "Phong A101")
  - capacity: max number of people
  - equipment: array of equipment tags (projector, whiteboard, etc.)
  - created_at: timestamp

  ### participants
  - id: uuid primary key
  - name: full name
  - department: department/unit name
  - available_slots: jsonb array of available time slot indices (0-based, 8 slots per day x 5 days = 40)
  - created_at: timestamp

  ### meetings
  - id: uuid primary key
  - title: meeting title
  - priority: 1-5 (5 = highest)
  - duration_slots: number of 30-min slots needed
  - required_capacity: minimum room capacity needed
  - participant_ids: jsonb array of participant ids
  - required_equipment: jsonb array of required equipment tags
  - created_at: timestamp

  ### schedule_runs
  - id: uuid primary key
  - run_name: descriptive name for this GA run
  - parameters: jsonb (generations, population_size, crossover_rate, mutation_rate)
  - final_fitness: float fitness score achieved
  - generations_data: jsonb array of {generation, best_fitness, avg_fitness} per generation
  - created_at: timestamp

  ### scheduled_meetings
  - id: uuid primary key
  - schedule_run_id: foreign key to schedule_runs
  - meeting_id: foreign key to meetings
  - room_id: foreign key to rooms
  - time_slot: integer (0-39, representing 30-min slots)
  - conflicts: integer count of constraint violations
  - created_at: timestamp

  ## Security
  - RLS enabled on all tables
  - Public read/write for demo purposes (anon role allowed to insert/select/update/delete)
*/

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 10,
  equipment jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL DEFAULT '',
  available_slots jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  priority integer NOT NULL DEFAULT 3,
  duration_slots integer NOT NULL DEFAULT 2,
  required_capacity integer NOT NULL DEFAULT 5,
  participant_ids jsonb NOT NULL DEFAULT '[]',
  required_equipment jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schedule_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_name text NOT NULL DEFAULT '',
  parameters jsonb NOT NULL DEFAULT '{}',
  final_fitness float NOT NULL DEFAULT 0,
  generations_data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduled_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_run_id uuid REFERENCES schedule_runs(id) ON DELETE CASCADE,
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  time_slot integer NOT NULL DEFAULT 0,
  conflicts integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_meetings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read participants" ON participants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read meetings" ON meetings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read schedule_runs" ON schedule_runs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can read scheduled_meetings" ON scheduled_meetings FOR SELECT TO anon, authenticated USING (true);

-- Public write policies (demo app - no auth required)
CREATE POLICY "Anyone can insert rooms" ON rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can insert participants" ON participants FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can insert meetings" ON meetings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can insert schedule_runs" ON schedule_runs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can insert scheduled_meetings" ON scheduled_meetings FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON participants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can update meetings" ON meetings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can update schedule_runs" ON schedule_runs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete participants" ON participants FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete meetings" ON meetings FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete schedule_runs" ON schedule_runs FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Anyone can delete scheduled_meetings" ON scheduled_meetings FOR DELETE TO anon, authenticated USING (true);
