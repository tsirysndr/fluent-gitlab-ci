import { GitlabCI, Job } from "../mod.ts";

const header = `
 You can copy and paste this template into a new \`.gitlab-ci.yml\` file.
 You should not add this template to an existing \`.gitlab-ci.yml\` file by using the \`include:\` keyword.

 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Clojure.gitlab-ci.yml
`;

const test = new Job().script("lein test");

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .comment(header)
  .comment("")
  .comment("Based on openjdk:8, already includes lein")
  .image("clojure:lein-2.7.0")
  .beforeScript("lein deps")
  .addJob("test", test)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
