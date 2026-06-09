export interface CodeExample {
  title: string;
  description?: string;
  code: string;
  language?: string;
  output?: string;
}

export interface FlowStep {
  label: string;
  detail?: string;
  highlight?: boolean;
}

export interface Visualization {
  type: 'flow' | 'sequence' | 'architecture' | 'comparison' | 'data-flow';
  title: string;
  description: string;
  steps?: FlowStep[];
  layers?: { label: string; items: string[] }[];
  columns?: { title: string; items: string[] }[];
}

export interface Section {
  heading: string;
  content: string;
  codeExamples?: CodeExample[];
  visualization?: Visualization;
  tips?: string[];
  warning?: string;
  keyTakeaway?: string;
}

export interface Topic {
  id: string;
  title: string;
  icon?: string;
  introduction: string;
  sections: Section[];
}

export interface Module {
  id: string;
  title: string;
  icon: string;
  description: string;
  topics: Topic[];
}

export interface Project {
  id: string;
  title: string;
  type: "mini" | "major";
  icon: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  features: string[];
  sections: Section[];
}

export const totalTopics = (modules: Module[]) =>
  modules.reduce((sum, m) => sum + m.topics.length, 0);
