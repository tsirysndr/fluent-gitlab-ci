# Deno Pipeline

[![deno module](https://shield.deno.dev/x/deno_pipeline)](https://deno.land/x/deno_pipeline)
![deno compatibility](https://shield.deno.dev/deno/^1.34)
[![](https://img.shields.io/codecov/c/gh/fluent-ci-templates/deno-pipeline)](https://codecov.io/gh/fluent-ci-templates/deno-pipeline)

A ready-to-use GitLab CI Pipeline and Jobs for your Deno projects.

## 🚀 Usage

Quick start:

```ts
import { GitLab } from "https://deno.land/x/deno_pipeline/mod.ts";

const { pipeline } = GitLab;

pipeline.write(); // Write the pipeline to the file .gitlab-ci.yml
```

Or, if you want to use the predefined jobs:

```ts
import { GitlabCI } from "https://deno.land/x/fluent_gitlab_ci/mod.ts";
import { GitLab } from "https://deno.land/x/deno_pipeline/mod.ts";

const { fmt, lint, test } = GitLab;

const const pipeline = new GitlabCI()
  .image("denoland/deno:alpine")
  .addJob("fmt", fmt)
  .addJob("lint", lint)
  .addJob("test", test);

pipeline.write(); // Write the pipeline to the file .gitlab-ci.yml
```

It will generate the following `.gitlab-ci.yml` file:

```yaml
# Do not edit this file directly. It is generated by https://deno.land/x/fluent_gitlab_ci

image: denoland/deno:alpine

fmt:
  image: denoland/deno:alpine
  script:
    - deno fmt --check

lint:
  image: denoland/deno:alpine
  script:
    - deno lint

test:
  image: denoland/deno:alpine
  script:
    - deno test
```

## 🧪 Advanced Usage

This package also provides a ready-to-use pipeline for
[Dagger](https://dagger.io/), just run the following command on your Deno
project:

```sh
dagger run deno run -A https://deno.land/x/deno_pipeline/ci.ts
```

Or, if you want to use the predefined jobs:

```ts
import Client, { connect } from "@dagger.io/dagger";
import { Dagger } from "https://deno.land/x/deno_pipeline/mod.ts";

const { fmt, lint, test } = Dagger;

function pipeline(src = ".") {
  connect(async (client: Client) => {
    await fmt(client, src);
    await lint(client, src);
    await test(client, src);
  });
}

pipeline();
```