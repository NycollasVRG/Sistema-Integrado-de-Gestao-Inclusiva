export type TimelineEventType =
  | "ESTUDO_DE_CASO"
  | "PEI"
  | "PEA"
  | "ATENDIMENTO"
  | "RAI"
  | "RAE";

export interface TimelineEventDTO {
  id: string;
  tipo: TimelineEventType;
  dataCriacao: string;
}
