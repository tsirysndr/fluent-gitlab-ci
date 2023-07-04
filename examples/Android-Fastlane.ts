import { GitlabCI, Job, Environment } from "../mod.ts";

const header = `
 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Android-Fastlane.gitlab-ci.yml

 Read more about how to use this script on this blog post https://about.gitlab.com/2019/01/28/android-publishing-with-gitlab-and-fastlane/
 If you are looking for a simpler template that does not publish, see the Android template.
 You will also need to configure your build.gradle, Dockerfile, and fastlane configuration to make this work.

 The following environment variables also need to be defined via the CI/CD settings:

 - $signing_jks_file_hex: A hex-encoded Java keystore file containing your signing keys.
   To encode this file, use \`xxd -p <your-keystore-file>.jks\` and save the output as \`$signing_jks_file_hex\`
 - $google_play_service_account_api_key_json: Your Google Play service account credentials - https://docs.fastlane.tools/getting-started/android/setup/#collect-your-google-credentials
`;

const updateContainerJob = new Job()
  .image("docker:stable")
  .stage("environment")
  .services(["docker:dind"]).script(`
    docker login -u gitlab-ci-token -p $CI_JOB_TOKEN $CI_REGISTRY
    docker pull --quiet $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG || true
    docker build --cache-from $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG -t $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG .
    docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
  `);

const updateContainer = new Job()
  .extends(".updateContainerJob")
  .only({ changes: ["Dockerfile"] });

const ensureContainer = new Job()
  .extends(".updateContainerJob")
  .allowFailure(true)
  .beforeScript(
    `
    mkdir -p ~/.docker && echo '{"experimental": "enabled"}' > ~/.docker/config.json
    docker login -u gitlab-ci-token -p $CI_JOB_TOKEN $CI_REGISTRY
  `
  )
  .beforeScript(
    `
if docker manifest inspect $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG > /dev/null; then
  echo 'Skipping job since there is already an image with this tag'
  exit 0
fi`,
    { multiline: true }
  );

const buildJob = new Job()
  .image("$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG")
  .stage("build")
  .beforeScript(
    `
  echo \"$signing_jks_file_hex\" | xxd -r -p - > android-signing-keystore.jks
  export VERSION_CODE="$CI_PIPELINE_IID" && echo \"$VERSION_CODE\"
  export VERSION_SHA=\"\${CI_COMMIT_SHA:0:8}\" && echo \"$VERSION_SHA\"
  `
  )
  .afterScript("rm -f android-signing-keystore.jks || true")
  .artifacts({ paths: ["app/build/outputs"] });

const buildDebug = new Job()
  .extends(".build_job")
  .script("bundle exec fastlane buildDebug");

const buildRelease = new Job()
  .extends(".build_job")
  .script("bundle exec fastlane buildRelease")
  .environment(new Environment("production"));

const testDebug = new Job()
  .image("$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG")
  .stage("test")
  .dependencies(["buildDebug"])
  .script("bundle exec fastlane test");

const publishInternal = new Job()
  .image("$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG")
  .stage("internal")
  .dependencies(["buildRelease"])
  .when("manual")
  .beforeScript(
    "echo $google_play_service_account_api_key_json > ~/google_play_api_key.json"
  )
  .afterScript("rm ~/google_play_api_key.json")
  .script("bundle exec fastlane internal");

const promoteJob = new Job()
  .image("$CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG")
  .when("manual")
  .dependencies([])
  .beforeScript(
    "echo $google_play_service_account_api_key_json > ~/google_play_api_key.json"
  )
  .afterScript("rm ~/google_play_api_key.json");

const promoteAlpha = new Job()
  .extends(".promote_job")
  .stage("alpha")
  .script("bundle exec fastlane promote_internal_to_alpha");

const promoteBeta = new Job()
  .extends(".promote_job")
  .stage("beta")
  .script("bundle exec fastlane promote_alpha_to_beta");

const promoteProduction = new Job()
  .extends(".promote_job")
  .stage("production")
  .only({
    variables: ["$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH"],
  })
  .script("bundle exec fastlane promote_beta_to_production");

const gitlabci = new GitlabCI()
  .comment(header)
  .comment("")
  .stages([
    "environment",
    "build",
    "test",
    "deploy",
    "internal",
    "alpha",
    "beta",
    "production",
  ])
  .addJob(".updateContainerJob", updateContainerJob)
  .addJob("updateContainer", updateContainer)
  .addJob("ensureContainer", ensureContainer)
  .addJob(".build_job", buildJob)
  .addJob("buildDebug", buildDebug)
  .addJob("buildRelease", buildRelease)
  .addJob("testDebug", testDebug)
  .addJob("publishInternal", publishInternal)
  .addJob(".promote_job", promoteJob)
  .addJob("promoteAlpha", promoteAlpha)
  .addJob("promoteBeta", promoteBeta)
  .addJob("promoteProduction", promoteProduction);

console.log(gitlabci.toString());
