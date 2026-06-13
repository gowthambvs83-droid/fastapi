import { Module, Project } from './types';
import { module1Foundation } from './module1-foundation';
import { module2Pydantic } from './module2-pydantic';
import { module3Routing } from './module3-routing';
import { module4Database } from './module4-database';
import { module5Auth } from './module5-auth';
import { module6Testing } from './module6-testing';
import { module7Deployment } from './module7-deployment';
import { module8Simulations } from './module8-simulations';
import { module9Architecture } from './module9-architecture';
import { module10Production } from './module10-production';
import { miniProjects, majorProjects } from './projects';

export const modules: Module[] = [
  module1Foundation,
  module2Pydantic,
  module3Routing,
  module4Database,
  module5Auth,
  module6Testing,
  module7Deployment,
  module8Simulations,
  module9Architecture,
  module10Production,
];

export const projects: Project[] = [...miniProjects, ...majorProjects];

export type { Module, Topic, Section, CodeExample, Visualization, Project, SimulationType, FrontendIntegration, FullStackExample } from './types';
