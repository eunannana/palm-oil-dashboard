export type RipenessClass = "Under Ripe" | "Ripe" | "Over Ripe";

export type DetectionBox = {
  id: number;
  label: RipenessClass;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectionSummary = {
  underRipe: number;
  ripe: number;
  overRipe: number;
};

export type DetectionResponse = {
  status: "success";
  message: string;
  predictedClass: RipenessClass;
  confidence: number;
  detections: DetectionBox[];
  summary: DetectionSummary;
};