# Fluent GitLab CI

[![deno module](https://shield.deno.dev/x/fluent_gitlab_ci)](https://deno.land/x/fluent_gitlab_ci)
![deno compatibility](https://shield.deno.dev/deno/^1.34)
[![](https://img.shields.io/codecov/c/gh/tsirysndr/fluent-gitlab-ci)](https://codecov.io/gh/tsirysndr/fluent-gitlab-ci)

Fluent GitLab CI is a deno module for generating GitLab CI configuration files easily and fluently.

## 🚀 Usage

```ts
import { GitlabCI, Job } from "https://deno.land/x/fluent_gitlab_ci/mod.ts";

const build = new Job().stage("build").script(`
  echo "Compiling the code..."
  echo "Compile complete."
`);

const unitTest = new Job().stage("test").script(`
  echo "Running unit tests... This will take about 60 seconds."
  sleep 60
  echo "Code coverage is 90%"
`);

const lint = new Job().stage("test").script(`
  echo "Linting code... This will take about 10 seconds."
  sleep 10
  echo "No lint issues found."
`);

const deploy = new Job().stage("deploy").script(`
  echo "Deploying application..."
  echo "Application successfully deployed."
`);

const gitlabci = new GitlabCI()
  .stages(["build", "test", "deploy"])
  .addJob("build-job", build)
  .addJob("unit-test-job", unitTest)
  .addJob("lint-test-job", lint)
  .addJob("deploy-job", deploy);

console.log(gitlabci.toString());

gitlabci.write();
```

See [examples](./examples) for more details.