export type Cache = {
  key?: string;
  paths: string[];
};

export type Rule = {
  if?: string;
  when?: string;
};

export type Job = {
  stage?: string;
  environment?: {
    name: string;
    url: string;
  };
  script?: string[];
  only?: string[];
  rules?: Rule[];
  when?: string;
  allow_failure?: boolean;
  except?: string[];
  artifacts?: {
    paths: string[];
  };
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
  workflow?: any;
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
)[];

export default GitlabSpec;
