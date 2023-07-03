import { GitlabCI, Job } from "../mod.ts";

const header = `
  You can copy and paste this template into a new \`.gitlab-ci.yml\` file.
  You should not add this template to an existing \`.gitlab-ci.yml\` file by using the \`include:\` keyword.

 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/C++.gitlab-ci.yml

 use the official gcc image, based on debian
 can use versions as well, like gcc:5.2
 see https://hub.docker.com/_/gcc/
`;

const build = new Job()
  .stage("build")
  .beforeScript("apt update && apt -y install make autoconf")
  .script("g++ helloworld.cpp -o mybinary")
  .cache(["*.o"])
  .artifacts({ paths: ["mybinary"] });

const test = new Job().stage("test").script("./runmytests.sh");

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .comment(header)
  .comment("")
  .image("gcc")
  .addJob("build", build)
  .addJob("test", test)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
