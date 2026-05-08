export type DetectionClass =
  | "empty_bunch"
  | "overripe"
  | "ripe"
  | "underripe"
  | "unripe";

export const DETECTION_CLASS_ORDER: DetectionClass[] = [
  "empty_bunch",
  "overripe",
  "ripe",
  "underripe",
  "unripe",
];

export const DETECTION_CLASS_LABELS: Record<DetectionClass, string> = {
  empty_bunch: "Empty Bunch",
  overripe: "Overripe",
  ripe: "Ripe",
  underripe: "Underripe",
  unripe: "Unripe",
};

export function formatDetectionClass(className: DetectionClass) {
  return DETECTION_CLASS_LABELS[className] ?? className;
}

export type DetectionBox = {
  id: number;
  label: DetectionClass;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DetectionSummary = {
  empty_bunch: number;
  overripe: number;
  ripe: number;
  underripe: number;
  unripe: number;
};

export type DetectionResponse = {
  status: "success";
  message: string;
  predictedClass: DetectionClass;
  confidence: number;
  detections: DetectionBox[];
  summary: DetectionSummary;
  totalDetections?: number;
  annotatedImage?: string;
  rawDetections?: FastApiDetectionBox[];
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