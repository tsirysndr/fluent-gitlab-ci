import { Job as JobSpec, Rule } from "./gitlabci_spec.ts";

class Job {
  private job: JobSpec;

  constructor() {
    this.job = {};
  }

  stage(stage: string): Job {
    this.job.stage = stage;
    return this;
  }

  environment(name: string, url: string): Job {
    this.job.environment = {
      name,
      url,
    };
    return this;
  }

  script(script: string): Job {
    script = script.trim();
    script
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .forEach((line) =>
        this.job.script
          ? this.job.script.push(line)
          : (this.job.script = [line])
      );
    return this;
  }

  only(only: string[]): Job {
    this.job.only = only;
    return this;
  }

  rules(rules: Rule[]): Job {
    this.job.rules = rules;
    return this;
  }

  when(when: string): Job {
    this.job.when = when;
    return this;
  }

  allowFailure(allowFailure: boolean): Job {
    this.job.allow_failure = allowFailure;
    return this;
  }

  except(except: string[]): Job {
    this.job.except = except;
    return this;
  }

  artifacts(paths: string[]): Job {
    this.job.artifacts = {
      paths,
    };
    return this;
  }

  services(services: string[]): Job {
    this.job.services = services;
    return this;
  }

  include(local: string, strategy: string): Job {
    this.job.include = this.job.include
      ? [
          ...this.job.include,
          {
            local,
            strategy,
          },
        ]
      : [
          {
            local,
            strategy,
          },
        ];
    return this;
  }

  parallel(parallel: number | { matrix: { [key: string]: any } }): Job {
    this.job.parallel = parallel;
    return this;
  }

  cache(key: string, paths: string[]): Job {
    this.job.cache = {
      key,
      paths,
    };
    return this;
  }

  into(): JobSpec {
    return this.job;
  }
}

export default Job;
