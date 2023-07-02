import { GitlabCI, Job } from "../mod.ts";

const build = new Job()
  .stage("build")
  .environment("review/$CI_COMMIT_REF_NAME", "$CI_ENVIRONMENT_URL")
  .script("echo 'Hello, world!'")
  .script(
    "echo 'This job is running against branch=$CI_COMMIT_REF_NAME and commit=$CI_COMMIT_SHA'"
  )
  .only(["merge_requests"])
  .rules([{ if: "$CI_MERGE_REQUEST_ID" }])
  .when("on_success")
  .allowFailure(false)
  .except(["master"])
  .artifacts(["public"])
  .services(["postgres:11.7"])
  .parallel(2)
  .cache("$CI_COMMIT_REF_SLUG", ["node_modules/"]);

const test = new Job().stage("test");
const unitTest = new Job().stage("test");
const lint = new Job().stage("test");
const deploy = new Job().stage("deploy");

const gitlabci = new GitlabCI()
  .stages(["build", "test", "deploy"])
  .comment("This is a comment")
  .comment("This is another comment")
  .comment("")
  .addJob("build-job", build)
  .addJob("test-job", test)
  .addJob("unit-test-job", unitTest)
  .addJob("lint-test-job", lint)
  .addJob("deploy-job", deploy);

console.log(gitlabci.toString());

gitlabci.toFile();
