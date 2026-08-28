export type DisasterType = "typhoon" | "flood" | "drought" | "landslide" | "fire";

export interface DisasterEvent {
  id: string;
  name: string;
  eventType: DisasterType;
  startDate: string;
  endDate: string;
  affectedProvinces: string[];
  description: string;
}
