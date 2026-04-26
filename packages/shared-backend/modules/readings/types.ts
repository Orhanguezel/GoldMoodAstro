import type { NatalChart, TransitChart } from '../astrology';

export interface DailyReadingRow {
  id: string;
  user_id: string;
  chart_id: string;
  reading_date: string | Date;
  content: string;
  embedding: number[] | null;
  transits_snapshot: TransitChart | null;
  model_used: string | null;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;
}

export interface BirthChartForReading {
  id: string;
  user_id: string;
  chart_data: NatalChart;
}

export interface GenerateDailyReadingResult {
  reading: DailyReadingRow;
  reused: boolean;
  similarity_max: number;
}
