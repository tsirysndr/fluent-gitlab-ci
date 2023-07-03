import { GitlabCI, Job } from "../mod.ts";

const header = `
 This template uses Test Kitchen with the kitchen-dokken driver to
 perform functional testing. Doing so requires that your runner be a
 Docker runner configured for privileged mode. Please see
 https://docs.gitlab.com/runner/executors/docker.html#use-docker-in-docker-with-privileged-mode
 for help configuring your runner properly, or, if you want to switch
 to a different driver, see http://kitchen.ci/docs/drivers

 You can copy and paste this template into a new \`.gitlab-ci.yml\` file.
 You should not add this template to an existing \`.gitlab-ci.yml\` file by using the \`include:\` keyword.

 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Chef.gitlab-ci.yml
`;

const cookstyle = new Job().stage("lint").script("chef exec cookstyle .");

const chefspec = new Job().stage("test").script("chef exec rspec spec");

const verifyCentos6 = new Job()
  .stage("functional")
  .beforeScript(
    `
    apt-get update
    apt-get -y install rsync
  `
  )
  .script("kitchen verify default-centos-6 --destroy=always");

const verifyCentos7 = new Job()
  .stage("functional")
  .beforeScript(
    `
    apt-get update
    apt-get -y install rsync
  `
  )
  .script("kitchen verify default-centos-7 --destroy=always");

const gitlabci = new GitlabCI()
  .comment(header)
  .comment("")
  .image("chef/chefdk")
  .services(["docker:dind"])
  .variables({
    DOCKER_HOST: "tcp://docker:2375",
    KITCHEN_LOCAL_YAML: ".kitchen.dokken.yml",
  })
  .stages(["build", "lint", "test", "functional", "deploy"])
  .addJob("cookstyle", cookstyle)
  .addJob("chefspec", chefspec)
  .addJob("verifyCentos6", verifyCentos6)
  .addJob("verifyCentos7", verifyCentos7);

console.log(gitlabci.toString());
