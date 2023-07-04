import { GitlabCI, Job } from "../mod.ts";

const header = `
 You can copy and paste this template into a new \`.gitlab-ci.yml\` file.
 You should not add this template to an existing \`.gitlab-ci.yml\` file by using the \`include:\` keyword.

 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Crystal.gitlab-ci.yml

 Official language image. Look for the different tagged releases at:
 https://hub.docker.com/r/crystallang/crystal/
`;

const spec = new Job().script("crystal spec");

const minitest = new Job().script("crystal test/spec_test.cr");

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .comment(header)
  .image("crystallang/crystal:latest")
  .services(["mysql:latest", "redis:latest", "postgres:latest"])
  .variables({
    POSTGRES_DB: "database_name",
  })
  .comment("Cache shards in between builds")
  .cache(["lib"])
  .comment(
    `
  This is a basic example for a shard or script which doesn't use
  services such as redis or postgres
  `
  )
  .beforeScript(
    `
  apt-get update -qq && apt-get install -y -qq libxml2-dev
  crystal -v
  shards
  `
  )
  .comment("If you are using built-in Crystal Spec.")
  .addJob("spec", spec)
  .comment("If you are using minitest.cr")
  .addJob("minitest", minitest)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
