import { assertEquals } from "https://deno.land/std@0.191.0/testing/asserts.ts";
import Job from "./job.ts";
import GitlabCI from "./gitlabci.ts";
import Environment from "./environment.ts";

Deno.test(function gettingStartedGitlabCITest() {
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

  const file = Deno.readTextFileSync("fixtures/Getting-Started.gitlab-ci.yml");
  assertEquals(gitlabci.toString(), file);
});

Deno.test(function fiveMinProductionAppGitlabCITest() {
  const header = `
  To contribute improvements to CI/CD templates, please follow the Development guide at:
  https://docs.gitlab.com/ee/development/cicd/templates.html
  This specific template is located at:
  https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/5-Minute-Production-App.gitlab-ci.yml

  This template is on early stage of development.
  Use it with caution. For usage instruction please read
  https://gitlab.com/gitlab-org/5-minute-production-app/deploy-template/-/blob/v3.0.0/README.md
`;

  const env = {
    TF_ADDRESS:
      "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/terraform/state/${CI_COMMIT_REF_SLUG}",
    TF_VAR_ENVIRONMENT_NAME:
      "${CI_PROJECT_PATH_SLUG}_${CI_PROJECT_ID}_${CI_COMMIT_REF_SLUG}",
    TF_VAR_SERVICE_DESK_EMAIL:
      "incoming+${CI_PROJECT_PATH_SLUG}-${CI_PROJECT_ID}-issue-@incoming.gitlab.com",
    TF_VAR_SHORT_ENVIRONMENT_NAME: "${CI_PROJECT_ID}-${CI_COMMIT_REF_SLUG}",
    TF_VAR_SMTP_FROM: "${SMTP_FROM}",
  };

  const awsVarsRules = [
    {
      if: "$AWS_ACCESS_KEY_ID && $AWS_SECRET_ACCESS_KEY && $AWS_DEFAULT_REGION",
      when: "on_success",
    },
    {
      when: "never",
    },
  ];

  const terraformApply = new Job()
    .stage("provision")
    .image(
      "$CI_TEMPLATE_REGISTRY_HOST/gitlab-org/5-minute-production-app/deploy-template/stable"
    )
    .extends(".needs_aws_vars")
    .resource_group("terraform").beforeScript(`
    cp /*.tf .
    cp /deploy.sh .
  `).script(`
    gitlab-terraform init
    gitlab-terraform plan
    gitlab-terraform plan-json
    gitlab-terraform apply
  `);

  const deploy = new Job()
    .stage("deploy")
    .image(
      "$CI_TEMPLATE_REGISTRY_HOST/gitlab-org/5-minute-production-app/deploy-template/stable"
    )
    .extends(".needs_aws_vars")
    .resource_group("deploy")
    .beforeScript(
      `
   cp /*.tf .
   cp /deploy.sh .
   cp /conf.nginx .
  `
    )
    .script("./deploy.sh")
    .artifacts({
      reports: {
        dotenv: "deploy.env",
      },
    })
    .environment(
      new Environment("$CI_COMMIT_REF_SLUG", "$DYNAMIC_ENVIRONMENT_URL").onStop(
        "terraform_destroy"
      )
    );

  const terraformDestroy = new Job()
    .variables({
      GIT_STRATEGY: "none",
    })
    .stage("destroy")
    .image(
      "$CI_TEMPLATE_REGISTRY_HOST/gitlab-org/5-minute-production-app/deploy-template/stable"
    )
    .beforeScript(
      `
   cp /*.tf .
   cp /deploy.sh .`
    )
    .script("gitlab-terraform destroy -auto-approve")
    .environment(new Environment("$CI_COMMIT_REF_SLUG").action("stop"))
    .rules([
      {
        if: '$AWS_ACCESS_KEY_ID && $AWS_SECRET_ACCESS_KEY && $AWS_DEFAULT_REGION && $CI_COMMIT_REF_PROTECTED == "false"',
        when: "manual",
      },
      {
        when: "never",
      },
    ]);
  const gitlabci = new GitlabCI()
    .comment(header)
    .comment("")
    .include({
      template: "Workflows/Branch-Pipelines.gitlab-ci.yml",
    })
    .include({
      template: "Jobs/Build.gitlab-ci.yml",
    })
    .stages(["build", "test", "provision", "deploy", "destroy"])
    .variables(env)
    .cache([".terraform"])
    .addJob(".needs_aws_vars", new Job().rules(awsVarsRules))
    .addJob("terraform_apply", terraformApply)
    .addJob("deploy", deploy)
    .addJob("terraform_destroy", terraformDestroy);

  const file = Deno.readTextFileSync(
    "fixtures/5-Minute-Production-App.gitlab-ci.yml"
  );
  assertEquals(gitlabci.toString(), file);
});
