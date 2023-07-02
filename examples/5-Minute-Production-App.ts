import { GitlabCI, Job } from "../mod.ts";

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
  .addJob(".needs_aws_vars", new Job().rules(awsVarsRules));

console.log(gitlabci.toString());
