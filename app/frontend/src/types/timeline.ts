export type TimelineEventType = "ESTUDO_DE_CASO" | "PEI" | "PEA";

export interface TimelineEventDTO {
  id: string;
  tipo: TimelineEventType;
  dataCriacao: string;
}
