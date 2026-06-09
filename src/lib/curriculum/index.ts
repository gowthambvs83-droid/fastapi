import { Module, Project } from './types';
import { module1Foundation } from './module1-foundation';
import { module2Pydantic } from './module2-pydantic';
import { module3Routing } from './module3-routing';
import { module4Database } from './module4-database';
import { module5Auth } from './module5-auth';
import { module6Testing } from './module6-testing';
import { module7Deployment } from './module7-deployment';
import { miniProjects, majorProjects } from './projects';

export const modules: Module[] = [
  module1Foundation,
  module2Pydantic,
  module3Routing,
  module4Database,
  module5Auth,
  module6Testing,
  module7Deployment,
];

export const projects: Project[] = [...miniProjects, ...majorProjects];

export type { Module, Topic, Section, CodeExample, Visualization, Project } from './types';
