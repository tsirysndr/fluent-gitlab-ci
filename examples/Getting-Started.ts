import { GitlabCI, Job } from "../mod.ts";

const header = `
This is a sample GitLab CI/CD configuration file that should run without any modifications.
It demonstrates a basic 3 stage CI/CD pipeline. Instead of real tests or scripts,
it uses echo commands to simulate the pipeline execution.

A pipeline is composed of independent jobs that run scripts, grouped into stages.
Stages run in sequential order, but jobs within stages run in parallel.

For more information, see: https://docs.gitlab.com/ee/ci/yaml/index.html#stages

You can copy and paste this template into a new \`.gitlab-ci.yml\` file.
You should not add this template to an existing \`.gitlab-ci.yml\` file by using the \`include:\` keyword.

To contribute improvements to CI/CD templates, please follow the Development guide at:
https://docs.gitlab.com/ee/development/cicd/templates.html
This specific template is located at:
https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Getting-Started.gitlab-ci.yml
`;

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
  .comment(header)
  .comment("")
  .stages(["build", "test", "deploy"])
  .addJob("build-job", build)
  .addJob("unit-test-job", unitTest)
  .addJob("lint-test-job", lint)
  .addJob("deploy-job", deploy);

console.log(gitlabci.toString());
