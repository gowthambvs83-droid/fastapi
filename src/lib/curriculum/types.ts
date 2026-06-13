export interface CodeExample {
  title: string;
  description?: string;
  code: string;
  language?: string;
  output?: string;
  whatHappened?: string[];
  tryToBreak?: string[];
}

export interface FlowStep {
  label: string;
  detail?: string;
  highlight?: boolean;
  timing?: string;
}

export interface Visualization {
  type: 'flow' | 'sequence' | 'architecture' | 'comparison' | 'data-flow' | 'requestFlow' | 'codeFlowDiagram';
  title: string;
  description: string;
  steps?: FlowStep[];
  layers?: { label: string; items: string[] }[];
  columns?: { title: string; items: string[] }[];
  animated?: boolean;
}

export interface FullStackExample {
  backend: CodeExample;
  frontend: CodeExample;
}

export interface FrontendIntegration {
  title: string;
  vanillaHtml: CodeExample;
  corsNote?: string;
}

export interface CommonMistake {
  mistake: string;
  fix: string;
}

export interface InterviewQuestion {
  question: string;
  answer: string;
}

export interface Section {
  heading: string;
  content: string;
  codeExamples?: CodeExample[];
  visualization?: Visualization;
  tips?: string[];
  warning?: string;
  keyTakeaway?: string;
  realWorldAnalogy?: string;
  commonMistakes?: CommonMistake[];
  interviewQuestions?: InterviewQuestion[];
  proTips?: string[];
  fullStackExample?: FullStackExample;
}

export interface Topic {
  id: string;
  title: string;
  icon?: string;
  introduction: string;
  sections: Section[];
  visualizations?: Visualization[];
  fullStackExample?: FullStackExample;
  frontendIntegration?: FrontendIntegration;
  simulation?: SimulationType;
}

export type SimulationType =
  | 'HTTP_REQUEST_FLOW'
  | 'JWT_LIFECYCLE'
  | 'DATABASE_QUERY'
  | 'WEBSOCKET_FLOW'
  | 'MIDDLEWARE_CHAIN';

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
