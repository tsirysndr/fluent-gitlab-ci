import { GitlabCI, Job } from "../mod.ts";

const header = `
 You can copy and paste this template into a new \`.gitlab-ci.yml\` file.
 You should not add this template to an existing \`.gitlab-ci.yml\` file by using the \`include:\` keyword.

 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Dart.gitlab-ci.yml

 https://hub.docker.com/_/dart
`;

const usePubCacheBin = new Job().beforeScript(`
    export PUB_CACHE=".pub-cache"
    export PATH="$PATH:$HOME/$PUB_CACHE/bin"
  `);

const uploadCache = new Job().cache(
  [
    ".pub-cache/bin/",
    ".pub-cache/global_packages/",
    ".pub-cache/hosted/",
    ".dart_tool/",
    ".packages",
  ],
  undefined,
  "on_success"
);

const downloadCache = new Job().cache(
  [".dart_tool/:", ".packages"],
  undefined,
  undefined,
  "pull"
);

const installDependencies = new Job()
  .stage(".pre")
  .extends([".use-pub-cache-bin", ".upload-cache"])
  .script("dart pub get --no-precompile");

const build = new Job()
  .stage("build")
  .needs(["install-dependencies"])
  .extends([".use-pub-cache-bin", ".upload-cache"])
  .script("dart pub get --offline --precompile");

const unitTest = new Job()
  .stage("test")
  .needs(["build"])
  .extends([".use-pub-cache-bin", ".upload-cache"])
  .script("dart test $PUB_VARS");

const lintTest = new Job()
  .stage("test")
  .needs(["install-dependencies"])
  .extends([".use-pub-cache-bin", ".upload-cache"])
  .script("dart analyze .");

const formatTest = new Job()
  .stage("test")
  .needs(["install-dependencies"])
  .extends([".use-pub-cache-bin", ".upload-cache"])
  .script("dart format --set-exit-if-changed bin/ lib/ test/");

const gitlabci = new GitlabCI()
  .comment(header)
  .image("dart:2.17")
  .variables({
    PUB_VARS:
      "--platform vm --timeout 30s --concurrency=6 --test-randomize-ordering-seed=random --reporter=expanded",
  })
  .addJob(".use-pub-cache-bin", usePubCacheBin)
  .comment("Cache generated files and plugins between builds.")
  .addJob(".upload-cache", uploadCache)
  .comment(
    `
  Cache downloaded dependencies and plugins between builds.
  To keep cache across branches add 'key: "$CI_JOB_NAME"'
  `
  )
  .addJob(".download-cache", downloadCache)
  .addJob("install-dependencies", installDependencies)
  .addJob("bulid", build)
  .addJob("unit-test", unitTest)
  .addJob("lint-test", lintTest)
  .addJob("format-test", formatTest);

console.log(gitlabci.toString());
