import { GitlabCI, Job } from "../mod.ts";

const build = new Job()
  .stage("build")
  .script("gradle --build-cache assemble")
  .cache(["build", ".gradle"], "$CI_COMMIT_REF_NAME", undefined, "pull");

const test = new Job()
  .stage("test")
  .script("gradle check")
  .cache(["build", ".gradle"], "$CI_COMMIT_REF_NAME", undefined, "pull");

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("gradle:alpine")
  .beforeScript(
    `
    GRADLE_USER_HOME="$(pwd)/.gradle"
    export GRADLE_USER_HOME
  `
  )
  .addJob("build", build)
  .addJob("test", test)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
