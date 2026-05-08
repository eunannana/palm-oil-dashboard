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
  totalDetections?: number;
  annotatedImage?: string;
};

export type FastApiDetectionBox = {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
};

export type FastApiDetectionResponse = {
  success: boolean;
  total_detections: number;
  summary: Record<string, number>;
  detections: FastApiDetectionBox[];
  annotated_image?: string;
};