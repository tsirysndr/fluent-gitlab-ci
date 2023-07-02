import { GitlabCI, Job } from "../mod.ts";
import Environment from "../src/environment.ts";

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
      dotenv: ".env",
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
      if: "'$AWS_ACCESS_KEY_ID && $AWS_SECRET_ACCESS_KEY && $AWS_DEFAULT_REGION && $CI_COMMIT_REF_PROTECTED == \"false\"'",
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

console.log(gitlabci.toString());
