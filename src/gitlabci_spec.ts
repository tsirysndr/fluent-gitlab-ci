import { z } from "https://deno.land/x/zod@v3.22.1/mod.ts";

export const WhenSchema = z.enum([
  "on_success",
  "on_failure",
  "always",
  "never",
  "manual",
]);

export const PolicySchema = z.enum(["pull-push", "pull", "push"]);

export const CacheSchema = z.object({
  when: WhenSchema.optional(),
  key: z.string().optional(),
  paths: z.array(z.string()),
  policy: PolicySchema.optional(),
});

export const RuleSchema = z.object({
  if: z.string().optional(),
  when: z.string().optional(),
  exists: z.array(z.string()).optional(),
});

export const ReportsSchema = z.object({
  junit: z.union([z.string(), z.array(z.string())]).optional(),
  browser_performance: z.string().optional(),
  coverage_report: z
    .object({
      coverage_format: z.string(),
      path: z.string(),
    })
    .optional(),
  codequality: z.union([z.string(), z.array(z.string())]).optional(),
  dotenv: z.union([z.string(), z.array(z.string())]).optional(),
  lsif: z.union([z.string(), z.array(z.string())]).optional(),
  sast: z.union([z.string(), z.array(z.string())]).optional(),
  dependency_scanning: z.union([z.string(), z.array(z.string())]).optional(),
  container_scanning: z.union([z.string(), z.array(z.string())]).optional(),
  dast: z.union([z.string(), z.array(z.string())]).optional(),
  license_management: z.union([z.string(), z.array(z.string())]).optional(),
  license_scanning: z.union([z.string(), z.array(z.string())]).optional(),
  requirements: z.union([z.string(), z.array(z.string())]).optional(),
  secret_detection: z.union([z.string(), z.array(z.string())]).optional(),
  metrics: z.union([z.string(), z.array(z.string())]).optional(),
  terraform: z.union([z.string(), z.array(z.string())]).optional(),
  cyclonedx: z.union([z.string(), z.array(z.string())]).optional(),
  load_performance: z.union([z.string(), z.array(z.string())]).optional(),
});

export const ArtifactsSchema = z.object({
  paths: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  expose_as: z.string().optional(),
  name: z.string().optional(),
  untracked: z.boolean().optional(),
  when: WhenSchema.optional(),
  expire_in: z.string().optional(),
  reports: ReportsSchema.optional(),
});

export const ActionSchema = z.enum([
  "start",
  "prepare",
  "stop",
  "verify",
  "access",
]);

export const DeploymentTierSchema = z.enum([
  "production",
  "staging",
  "testing",
  "development",
  "other",
]);

export const EnvironmentSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  on_stop: z.string().optional(),
  action: ActionSchema.optional(),
  auto_stop_in: z.string().optional(),
  kubernetes: z
    .object({
      namespace: z.string(),
    })
    .optional(),
  deployment_tier: DeploymentTierSchema.optional(),
});

export const VariableSchema = z.record(z.string());

export const OnlySchema = z.union([
  z.array(z.string()),
  z.object({
    changes: z.array(z.string()).optional(),
    variables: z.array(z.string()).optional(),
  }),
]);

export const JobSchema = z.object({
  stage: z.string().optional(),
  environment: z.union([EnvironmentSchema, z.string()]).optional(),
  image: z.string().optional(),
  extends: z.union([z.string(), z.array(z.string())]).optional(),
  interruptible: z.boolean().optional(),
  needs: z.array(z.string()).optional(),
  resource_group: z.string().optional(),
  script: z.array(z.string()).optional(),
  before_script: z.array(z.string()).optional(),
  after_script: z.array(z.string()).optional(),
  only: OnlySchema.optional(),
  rules: z.array(RuleSchema).optional(),
  when: WhenSchema.optional(),
  allow_failure: z.boolean().optional(),
  except: z.array(z.string()).optional(),
  artifacts: ArtifactsSchema.optional(),
  services: z.array(z.string()).optional(),
  parallel: z
    .union([
      z.number(),
      z.object({
        matrix: z.record(z.any()),
      }),
    ])
    .optional(),
  include: z
    .array(
      z.object({
        local: z.string(),
        strategy: z.string(),
      })
    )
    .optional(),
  cache: CacheSchema.optional(),
  variables: VariableSchema.optional(),
  dependencies: z.array(z.string()).optional(),
  coverage: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const IncludeSchema = z.union([
  z.array(
    z.object({
      template: z.string(),
    })
  ),
  z.string(),
]);

export const GitlabSpecSchema = z.object({
  image: z
    .union([
      z.object({
        name: z.string(),
        pull_policy: z.string(),
      }),
      z.string(),
    ])
    .optional(),
  services: z.array(z.string()).optional(),
  before_script: z.array(z.string()).optional(),
  after_script: z.array(z.string()).optional(),
  variables: VariableSchema.optional(),
  cache: CacheSchema.optional(),
  artifacts: ArtifactsSchema.optional(),
  hooks: z
    .object({
      pre_get_sources_script: z.string(),
    })
    .optional(),
  interruptible: z.boolean().optional(),
  retry: z.any().optional(),
  tags: z.any().optional(),
  timeout: z.any().optional(),
  include: z.array(IncludeSchema).optional(),
  pages: z.any().optional(),
  workflow: z
    .object({
      rules: z.array(RuleSchema),
    })
    .optional(),
  stages: z.array(z.string()).optional(),
  ["string"]: z.union([JobSchema, z.any()]).optional(),
});

export type When = z.infer<typeof WhenSchema>;

export type Policy = z.infer<typeof PolicySchema>;

export type Cache = z.infer<typeof CacheSchema>;

export type Rule = z.infer<typeof RuleSchema>;

export type Reports = z.infer<typeof ReportsSchema>;

export type Artifacts = z.infer<typeof ArtifactsSchema>;

export type Action = z.infer<typeof ActionSchema>;

export type DeploymentTier = z.infer<typeof DeploymentTierSchema>;

export type Environment = z.infer<typeof EnvironmentSchema>;

export type Variable = z.infer<typeof VariableSchema>;

export type Only = z.infer<typeof OnlySchema>;

export type Job = z.infer<typeof JobSchema>;

export type Include = z.infer<typeof IncludeSchema>;

type GitlabSpec = z.infer<typeof GitlabSpecSchema>;

export type YamlSpec = (
  | { [key: string]: Job }
  | string
  | { stages: string[] }
  | { variables: Variable }
  | { cache: Cache }
  | { include: Include }
  | { image: string }
  | { before_script: string[] }
  | { services: string[] }
)[];

export default GitlabSpec;
