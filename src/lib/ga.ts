import type { Meeting, Participant, Room, GAParameters, GenerationData } from './supabase';

// 5 working days x 16 slots per day (08:00-12:00 + 13:30-17:30 in 30-min blocks = 16 slots)
export const TOTAL_SLOTS = 80;
export const SLOTS_PER_DAY = 16;
export const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
export const SLOT_TIMES = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

// Each gene: { meetingIndex, roomIndex, timeSlot }
export type Gene = {
  meetingIndex: number;
  roomIndex: number;
  timeSlot: number; // start slot (0-based, must fit duration)
};

export type Chromosome = Gene[];

export type Individual = {
  chromosome: Chromosome;
  fitness: number;
};

export function slotToLabel(slot: number): { day: string; time: string } {
  const day = DAYS[Math.floor(slot / SLOTS_PER_DAY)];
  const time = SLOT_TIMES[slot % SLOTS_PER_DAY];
  return { day, time };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomGene(
  meetingIndex: number,
  meeting: Meeting,
  rooms: Room[]
): Gene {
  const validRooms = rooms
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => r.capacity >= meeting.required_capacity);
  const roomChoice = validRooms.length > 0
    ? validRooms[randomInt(0, validRooms.length - 1)]
    : { r: rooms[0], i: 0 };

  // Ensure duration fits within the day
  const maxStart = TOTAL_SLOTS - meeting.duration_slots;
  const timeSlot = randomInt(0, maxStart);

  return { meetingIndex, roomIndex: roomChoice.i, timeSlot };
}

function createRandomChromosome(meetings: Meeting[], rooms: Room[]): Chromosome {
  return meetings.map((m, i) => randomGene(i, m, rooms));
}

export function calcFitness(
  chromosome: Chromosome,
  meetings: Meeting[],
  rooms: Room[],
  participants: Participant[]
): number {
  let penalty = 0;

  for (let i = 0; i < chromosome.length; i++) {
    const geneA = chromosome[i];
    const meetingA = meetings[geneA.meetingIndex];
    const roomA = rooms[geneA.roomIndex];

    // Room capacity constraint
    if (roomA.capacity < meetingA.required_capacity) {
      penalty += 50;
    }

    // Required equipment constraint
    for (const eq of meetingA.required_equipment) {
      if (!roomA.equipment.includes(eq)) {
        penalty += 20;
      }
    }

    // Duration must not overflow end of day
    const dayStart = Math.floor(geneA.timeSlot / SLOTS_PER_DAY) * SLOTS_PER_DAY;
    const dayEnd = dayStart + SLOTS_PER_DAY;
    if (geneA.timeSlot + meetingA.duration_slots > dayEnd) {
      penalty += 40;
    }

    // Participant availability constraint
    for (const pid of meetingA.participant_ids) {
      const p = participants.find(x => x.id === pid);
      if (p) {
        for (let s = geneA.timeSlot; s < geneA.timeSlot + meetingA.duration_slots; s++) {
          if (!p.available_slots.includes(s)) {
            penalty += 15;
          }
        }
      }
    }

    // Check conflicts with other meetings
    for (let j = i + 1; j < chromosome.length; j++) {
      const geneB = chromosome[j];
      const meetingB = meetings[geneB.meetingIndex];

      // Same room, overlapping time
      if (geneA.roomIndex === geneB.roomIndex) {
        const aEnd = geneA.timeSlot + meetingA.duration_slots;
        const bEnd = geneB.timeSlot + meetingB.duration_slots;
        if (geneA.timeSlot < bEnd && aEnd > geneB.timeSlot) {
          penalty += 100;
        }
      }

      // Same participant in overlapping meetings
      const sharedParticipants = meetingA.participant_ids.filter(pid =>
        meetingB.participant_ids.includes(pid)
      );
      if (sharedParticipants.length > 0) {
        const aEnd = geneA.timeSlot + meetingA.duration_slots;
        const bEnd = geneB.timeSlot + meetingB.duration_slots;
        if (geneA.timeSlot < bEnd && aEnd > geneB.timeSlot) {
          penalty += 80 * sharedParticipants.length;
        }
      }
    }
  }

  // Fitness = inverse of penalty (higher is better), normalize 0-100
  const fitness = 1000 / (1 + penalty);
  return Math.min(fitness, 100);
}

function tournamentSelect(population: Individual[], tournamentSize = 3): Individual {
  let best = population[randomInt(0, population.length - 1)];
  for (let i = 1; i < tournamentSize; i++) {
    const candidate = population[randomInt(0, population.length - 1)];
    if (candidate.fitness > best.fitness) best = candidate;
  }
  return best;
}

function crossover(parentA: Chromosome, parentB: Chromosome, rate: number): [Chromosome, Chromosome] {
  if (Math.random() > rate || parentA.length <= 1) {
    return [
      parentA.map(g => ({ ...g })),
      parentB.map(g => ({ ...g })),
    ];
  }
  // Single-point crossover
  const point = randomInt(1, parentA.length - 1);
  const childA: Chromosome = [
    ...parentA.slice(0, point).map(g => ({ ...g })),
    ...parentB.slice(point).map(g => ({ ...g })),
  ];
  const childB: Chromosome = [
    ...parentB.slice(0, point).map(g => ({ ...g })),
    ...parentA.slice(point).map(g => ({ ...g })),
  ];
  return [childA, childB];
}

function mutate(
  chromosome: Chromosome,
  rate: number,
  meetings: Meeting[],
  rooms: Room[]
): Chromosome {
  return chromosome.map((gene) => {
    if (Math.random() < rate) {
      const meeting = meetings[gene.meetingIndex];
      return randomGene(gene.meetingIndex, meeting, rooms);
    }
    return { ...gene };
  });
}

export type GAProgressCallback = (
  generation: number,
  best: Individual,
  generationsData: GenerationData[]
) => void;

export async function runGA(
  meetings: Meeting[],
  rooms: Room[],
  participants: Participant[],
  params: GAParameters,
  onProgress?: GAProgressCallback
): Promise<{ best: Individual; generationsData: GenerationData[] }> {
  const { generations, population_size, crossover_rate, mutation_rate, elitism_count } = params;

  // Initialize population
  let population: Individual[] = Array.from({ length: population_size }, () => {
    const chromosome = createRandomChromosome(meetings, rooms);
    return {
      chromosome,
      fitness: calcFitness(chromosome, meetings, rooms, participants),
    };
  });

  const generationsData: GenerationData[] = [];
  let overallBest = population.reduce((b, ind) => ind.fitness > b.fitness ? ind : b, population[0]);

  for (let gen = 0; gen < generations; gen++) {
    // Sort by fitness descending
    population.sort((a, b) => b.fitness - a.fitness);

    const avgFitness = population.reduce((s, i) => s + i.fitness, 0) / population.length;
    generationsData.push({
      generation: gen + 1,
      best_fitness: population[0].fitness,
      avg_fitness: parseFloat(avgFitness.toFixed(2)),
    });

    if (population[0].fitness > overallBest.fitness) {
      overallBest = { chromosome: population[0].chromosome.map(g => ({ ...g })), fitness: population[0].fitness };
    }

    // Report every 5 generations or on last
    if (onProgress && (gen % 5 === 0 || gen === generations - 1)) {
      onProgress(gen + 1, overallBest, [...generationsData]);
      // Yield to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Early stop if perfect
    if (overallBest.fitness >= 99.9) break;

    // Build next generation
    const nextPop: Individual[] = [];

    // Elitism: carry top N
    for (let i = 0; i < elitism_count && i < population.length; i++) {
      nextPop.push({ chromosome: population[i].chromosome.map(g => ({ ...g })), fitness: population[i].fitness });
    }

    // Fill rest with crossover + mutation
    while (nextPop.length < population_size) {
      const parentA = tournamentSelect(population);
      const parentB = tournamentSelect(population);
      const [childAChrom, childBChrom] = crossover(parentA.chromosome, parentB.chromosome, crossover_rate);
      const mutatedA = mutate(childAChrom, mutation_rate, meetings, rooms);
      const mutatedB = mutate(childBChrom, mutation_rate, meetings, rooms);
      nextPop.push({
        chromosome: mutatedA,
        fitness: calcFitness(mutatedA, meetings, rooms, participants),
      });
      if (nextPop.length < population_size) {
        nextPop.push({
          chromosome: mutatedB,
          fitness: calcFitness(mutatedB, meetings, rooms, participants),
        });
      }
    }

    population = nextPop;
  }

  return { best: overallBest, generationsData };
}

export function countConflicts(
  chromosome: Chromosome,
  meetings: Meeting[],
  rooms: Room[],
  participants: Participant[]
): number[] {
  return chromosome.map((gene, i) => {
    let c = 0;
    const meetingA = meetings[gene.meetingIndex];
    const roomA = rooms[gene.roomIndex];
    if (roomA.capacity < meetingA.required_capacity) c++;
    for (const eq of meetingA.required_equipment) {
      if (!roomA.equipment.includes(eq)) c++;
    }
    const dayStart = Math.floor(gene.timeSlot / SLOTS_PER_DAY) * SLOTS_PER_DAY;
    if (gene.timeSlot + meetingA.duration_slots > dayStart + SLOTS_PER_DAY) c++;
    for (let j = 0; j < chromosome.length; j++) {
      if (j === i) continue;
      const geneB = chromosome[j];
      const meetingB = meetings[geneB.meetingIndex];
      if (gene.roomIndex === geneB.roomIndex) {
        const aEnd = gene.timeSlot + meetingA.duration_slots;
        const bEnd = geneB.timeSlot + meetingB.duration_slots;
        if (gene.timeSlot < bEnd && aEnd > geneB.timeSlot) c++;
      }
    }
    return c;
  });
}
