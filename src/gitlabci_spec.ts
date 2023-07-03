export type Cache = {
  key?: string;
  paths: string[];
};

export type Rule = {
  if?: string;
  when?: string;
  exists?: string[];
};

export type Reports = {
  junit?: string | string[];
  browser_performance?: string;
  coverage_report?: {
    coverage_format: string;
    path: string;
  };
  codequality?: string | string[];
  dotenv?: string | string[];
  lsif?: string | string[];
  sast?: string | string[];
  dependency_scanning?: string | string[];
  container_scanning?: string | string[];
  dast?: string | string[];
  license_management?: string | string[];
  license_scanning?: string | string[];
  requirements?: string | string[];
  secret_detection?: string | string[];
  metrics?: string | string[];
  terraform?: string | string[];
  cyclonedx?: string | string[];
  load_performance?: string | string[];
};

export type Artifacts = {
  paths?: string[];
  exclude?: string[];
  expose_as?: string;
  name?: string;
  untracked?: boolean;
  when?: "on_success" | "on_failure" | "always";
  expires_in?: string;
  reports?: Reports;
};

export type Action = "start" | "prepare" | "stop" | "verify" | "access";

export type DeploymentTier =
  | "production"
  | "staging"
  | "testing"
  | "development"
  | "other";

export type Environment = {
  name: string;
  url?: string;
  on_stop?: string;
  action?: Action;
  auto_stop_in?: string;
  kubernetes?: {
    namespace: string;
  };
  deployment_tier?: DeploymentTier;
};
export type Job = {
  stage?: string;
  environment?: Environment | string;
  image?: string;
  extends?: string;
  interruptible?: boolean;
  needs?: string[];
  resource_group?: string;
  script?: string[];
  before_script?: string[];
  after_script?: string[];
  only?: string[] | { changes?: string[]; variables?: string[] };
  rules?: Rule[];
  when?: string;
  allow_failure?: boolean;
  except?: string[];
  artifacts?: Artifacts;
  services?: string[];
  parallel?:
    | {
        matrix: {
          [key: string]: any;
        };
      }
    | number;
  include?: {
    local: string;
    strategy: string;
  }[];
  cache?: Cache;
  variables?: Variable;
  dependencies?: string[];
};

export type Variable = {
  [key: string]: string;
};

export type Include =
  | {
      template?: string;
    }[]
  | string;

type GitlabSpec = {
  image?:
    | {
        name: string;
        pull_policy: string;
      }
    | string;
  services?: string[];
  before_script?: string[];
  after_script?: string[];
  variables?: Variable;
  cache?: {
    key?: string;
    paths: string[];
  };
  artifacts?: any;
  hooks?: {
    pre_get_sources_script: string;
  };
  interruptible?: any;
  retry?: any;
  tags?: any;
  timeout?: any;
  include?: Include[];
  pages?: any;
  workflow?: {
    rules: Rule[];
  };
  stages?: string[];
  build?: {
    stage: string;
    script: string[];
  };
  secrets?: any;
  [key: string]: Job | any | undefined;
};

export type YamlSpec = (
  | { [key: string]: Job }
  | string
  | { stages: string[] }
  | { variables: Variable }
  | { cache: Cache }
  | { include: Include }
  | { image: string }
  | { before_script: string[] }
)[];

export default GitlabSpec;
