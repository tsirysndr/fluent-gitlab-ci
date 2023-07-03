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

Deno.test(function androidFastlaneGitlabCITest() {
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

  const bulidDebug = new Job()
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
    .addJob("buildDebug", bulidDebug)
    .addJob("buildRelease", buildRelease)
    .addJob("testDebug", testDebug)
    .addJob("publishInternal", publishInternal)
    .addJob(".promote_job", promoteJob)
    .addJob("promoteAlpha", promoteAlpha)
    .addJob("promoteBeta", promoteBeta)
    .addJob("promoteProduction", promoteProduction);

  const file = Deno.readTextFileSync("fixtures/Android-Fastlane.gitlab-ci.yml");
  assertEquals(gitlabci.toString(), file);
});

Deno.test(function androidLatestGitlabCITest() {
  const header = `
  To contribute improvements to CI/CD templates, please follow the Development guide at:
  https://docs.gitlab.com/ee/development/cicd/templates.html
  This specific template is located at:
  https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Android.gitlab-ci.yml
  
  Read more about this script on this blog post https://about.gitlab.com/2018/10/24/setting-up-gitlab-ci-for-android-projects/, by Jason Lenny
  If you are interested in using Android with FastLane for publishing take a look at the Android-Fastlane template.  
  `;

  const lintDebug = new Job()
    .interruptible(true)
    .stage("build")
    .script("./gradlew -Pci --console=plain :app:lintDebug -PbuildDir=lint");

  const assembleDebug = new Job()
    .interruptible(true)
    .stage("build")
    .script("./gradlew assembleDebug")
    .artifacts({
      paths: ["app/build/outputs/"],
    });

  const debugTests = new Job()
    .interruptible(true)
    .stage("test")
    .script("./gradlew -Pci --console=plain :app:testDebug");

  const gitlabci = new GitlabCI()
    .comment(header)
    .comment("")
    .image("openjdk:11-jdk")
    .variables({
      ANDROID_COMPILE_SDK: "30",
      ANDROID_BUILD_TOOLS: "30.0.3",
      ANDROID_SDK_TOOLS: "7583922",
    })
    .comment("Packages installation before running script")
    .beforeScript(
      `
    apt-get --quiet update --yes
    apt-get --quiet install --yes wget tar unzip lib32stdc++6 lib32z1
    export ANDROID_HOME="\${PWD}/android-home"
    install -d $ANDROID_HOME
    wget --output-document=$ANDROID_HOME/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-\${ANDROID_SDK_TOOLS}_latest.zip
    pushd $ANDROID_HOME
    unzip -d cmdline-tools cmdline-tools.zip
    pushd cmdline-tools
    mv cmdline-tools tools || true
    popd
    popd
    export PATH=$PATH:\${ANDROID_HOME}/cmdline-tools/tools/bin/
    sdkmanager --version
    yes | sdkmanager --licenses || true
    sdkmanager "platforms;android-\${ANDROID_COMPILE_SDK}"
    sdkmanager "platform-tools"
    sdkmanager "build-tools;\${ANDROID_BUILD_TOOLS}"
    chmod +x ./gradlew
  `
    )
    .comment("Basic android and gradle stuff")
    .comment("Check linting")
    .addJob("lintDebug", lintDebug)
    .comment("Make Project")
    .addJob("assembleDebug", assembleDebug)
    .comment("Run all tests, if any fails, interrupt the pipeline(fail it)")
    .addJob("debugTests", debugTests);

  const file = Deno.readTextFileSync("fixtures/Android.latest.gitlab-ci.yml");
  assertEquals(gitlabci.toString(), file);
});

Deno.test(function androidGitlabCITest() {
  const header = `
To contribute improvements to CI/CD templates, please follow the Development guide at:
https://docs.gitlab.com/ee/development/cicd/templates.html
This specific template is located at:
https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Android.gitlab-ci.yml

Read more about this script on this blog post https://about.gitlab.com/2018/10/24/setting-up-gitlab-ci-for-android-projects/, by Jason Lenny
If you are interested in using Android with FastLane for publishing take a look at the Android-Fastlane template.
`;

  const lintDebug = new Job()
    .interruptible(true)
    .stage("build")
    .script("./gradlew -Pci --console=plain :app:lintDebug -PbuildDir=lint")
    .artifacts({
      paths: ["app/lint/reports/lint-results-debug.html"],
      expose_as: "lint-report",
      when: "always",
    });

  const assembleDebug = new Job()
    .interruptible(true)
    .stage("build")
    .script("./gradlew assembleDebug")
    .artifacts({
      paths: ["app/build/outputs/"],
    });

  const debugTests = new Job()
    .needs(["lintDebug", "assembleDebug"])
    .interruptible(true)
    .stage("test")
    .script("./gradlew -Pci --console=plain :app:testDebug");

  const gitlabci = new GitlabCI()
    .comment(header)
    .comment("")
    .image("eclipse-temurin:17-jdk-jammy")
    .variables({
      ANDROID_COMPILE_SDK: "33",
      ANDROID_BUILD_TOOLS: "33.0.2",
      ANDROID_SDK_TOOLS: "9477386",
    })
    .comment("Packages installation before running script")
    .beforeScript(
      `
   apt-get --quiet update --yes
   apt-get --quiet install --yes wget unzip
   export ANDROID_HOME="\${PWD}/android-sdk-root"
   install -d $ANDROID_HOME
   wget --no-verbose --output-document=$ANDROID_HOME/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-\${ANDROID_SDK_TOOLS}_latest.zip
   unzip -q -d "$ANDROID_HOME/cmdline-tools" "$ANDROID_HOME/cmdline-tools.zip"
   mv -T "$ANDROID_HOME/cmdline-tools/cmdline-tools" "$ANDROID_HOME/cmdline-tools/tools"
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/cmdline-tools/tools/bin
   sdkmanager --version
   yes | sdkmanager --licenses > /dev/null || true
   sdkmanager "platforms;android-\${ANDROID_COMPILE_SDK}"
   sdkmanager "platform-tools"
   sdkmanager "build-tools;\${ANDROID_BUILD_TOOLS}"
   chmod +x ./gradlew
  `
    )
    .comment("Basic android and gradle stuff")
    .comment("Check linting")
    .addJob("lintDebug", lintDebug)
    .comment("Make Project")
    .addJob("assembleDebug", assembleDebug)
    .comment("Run all tests, if any fails, interrupt the pipeline(fail it)")
    .addJob("debugTests", debugTests);

  const file = Deno.readTextFileSync("fixtures/Android.gitlab-ci.yml");
  assertEquals(gitlabci.toString(), file);
});

Deno.test(function autoDevOpsGitlabCITest() {
  const header = `
 To contribute improvements to CI/CD templates, please follow the Development guide at:
 https://docs.gitlab.com/ee/development/cicd/templates.html
 This specific template is located at:
 https://gitlab.com/gitlab-org/gitlab/-/blob/master/lib/gitlab/ci/templates/Auto-DevOps.gitlab-ci.yml

 Auto DevOps

 This CI/CD configuration provides a standard pipeline for
 * building a Docker image (using a buildpack if necessary),
 * storing the image in the container registry,
 * running tests from a buildpack,
 * running code quality analysis,
 * creating a review app for each topic branch,
 * and continuous deployment to production

 Test jobs may be disabled by setting environment variables:
 * test: TEST_DISABLED
 * code_quality: CODE_QUALITY_DISABLED
 * license_management: LICENSE_MANAGEMENT_DISABLED
 * browser_performance: BROWSER_PERFORMANCE_DISABLED
 * load_performance: LOAD_PERFORMANCE_DISABLED
 * sast: SAST_DISABLED
 * secret_detection: SECRET_DETECTION_DISABLED
 * dependency_scanning: DEPENDENCY_SCANNING_DISABLED
 * container_scanning: CONTAINER_SCANNING_DISABLED
 * dast: DAST_DISABLED
 * review: REVIEW_DISABLED
 * stop_review: REVIEW_DISABLED
 * code_intelligence: CODE_INTELLIGENCE_DISABLED

 In order to deploy, you must have a Kubernetes cluster configured either
 via a project integration, or via group/project variables.
 KUBE_INGRESS_BASE_DOMAIN must also be set on the cluster settings,
 as a variable at the group or project level, or manually added below.

 Continuous deployment to production is enabled by default.
 If you want to deploy to staging first, set STAGING_ENABLED environment variable.
 If you want to enable incremental rollout, either manual or time based,
 set INCREMENTAL_ROLLOUT_MODE environment variable to "manual" or "timed".
 If you want to use canary deployments, set CANARY_ENABLED environment variable.

 If Auto DevOps fails to detect the proper buildpack, or if you want to
 specify a custom buildpack, set a project variable \`BUILDPACK_URL\` to the
 repository URL of the buildpack.
 e.g. BUILDPACK_URL=https://github.com/heroku/heroku-buildpack-ruby.git#v142
 If you need multiple buildpacks, add a file to your project called
 \`.buildpacks\` that contains the URLs, one on each line, in order.
 Note: Auto CI does not work with multiple buildpacks yet
`;

  const env = {
    CS_DEFAULT_BRANCH_IMAGE:
      "$CI_REGISTRY_IMAGE/$CI_DEFAULT_BRANCH:$CI_COMMIT_SHA",
    POSTGRES_USER: "user",
    POSTGRES_PASSWORD: "testing-password",
    POSTGRES_DB: "$CI_ENVIRONMENT_SLUG",
    DOCKER_DRIVER: "overlay2",
    ROLLOUT_RESOURCE_TYPE: "deployment",
    DOCKER_TLS_CERTDIR: "",
  };

  const stages = [
    "build",
    "test",
    "deploy",
    "review",
    "dast",
    "staging",
    "canary",
    "production",
    "incremental rollout 10%",
    "incremental rollout 25%",
    "incremental rollout 50%",
    "incremental rollout 100%",
    "performance",
    "cleanup",
  ];

  const workflow = {
    rules: [
      {
        if: '$BUILDPACK_URL || $AUTO_DEVOPS_EXPLICITLY_ENABLED == "1" || $DOCKERFILE_PATH',
      },
      {
        exists: ["Dockerfile"],
      },
      {
        exists: ["project.clj"],
      },
      {
        exists: [
          "go.mod",
          "Gopkg.mod",
          "Godeps/Godeps.json",
          "vendor/vendor.json",
          "glide.yaml",
          "src/**/*.go",
        ],
      },
      {
        exists: ["gradlew", "build.gradle", "settings.gradle"],
      },
      {
        exists: [
          "pom.xml",
          "pom.atom",
          "pom.clj",
          "pom.groovy",
          "pom.rb",
          "pom.scala",
          "pom.yaml",
          "pom.yml",
        ],
      },
      {
        exists: [".buildpacks"],
      },
      {
        exists: ["package.json"],
      },
      {
        exists: ["composer.json", "index.php"],
      },
      {
        exists: ["**/conf/application.conf"],
      },

      {
        exists: ["requirements.txt", "setup.py", "Pipfile"],
      },
      {
        exists: ["Gemfile"],
      },
      {
        exists: [
          "*.sbt",
          "project/*.scala",
          ".sbt/*.scala",
          "project/build.properties",
        ],
      },
      {
        exists: [".static"],
      },
    ],
  };

  const gitlabci = new GitlabCI()
    .comment(header)
    .comment("")
    .image("alpine:latest")
    .variables(env)
    .stages(stages)
    .workflow(workflow)
    .comment(
      `
  NOTE: These links point to the latest templates for development in GitLab canonical project,
  therefore the actual templates that were included for Auto DevOps pipelines
  could be different from the contents in the links.
  To view the actual templates, please replace \`master\` to the specific GitLab version when
  the Auto DevOps pipeline started running e.g. \`v13.0.2-ee\`.
  `
    )
    .include({ template: "Jobs/Build.gitlab-ci.yml" })
    .include({ template: "Jobs/Test.gitlab-ci.yml" })
    .include({ template: "Jobs/Code-Quality.gitlab-ci.yml" })
    .include({ template: "Jobs/Code-Intelligence.gitlab-ci.yml" })
    .include({ template: "Jobs/Deploy.gitlab-ci.yml" })
    .include({ template: "Jobs/Deploy/ECS.gitlab-ci.yml" })
    .include({ template: "Jobs/Deploy/EC2.gitlab-ci.yml" })
    .include({ template: "Jobs/DAST-Default-Branch-Deploy.gitlab-ci.yml" })
    .include({ template: "Jobs/Browser-Performance-Testing.gitlab-ci.yml" })
    .include({ template: "Jobs/Helm-2to3.gitlab-ci.yml" })
    .include({ template: "Security/DAST.gitlab-ci.yml" })
    .include({ template: "Jobs/Container-Scanning.gitlab-ci.yml" })
    .include({ template: "Jobs/Dependency-Scanning.gitlab-ci.yml" })
    .include({ template: "Jobs/License-Scanning.gitlab-ci.yml" })
    .include({ template: "Jobs/SAST.gitlab-ci.yml" })
    .include({ template: "Jobs/Secret-Detection.gitlab-ci.yml" })
    .comment(
      `
 The latest build job generates a dotenv report artifact with a CI_APPLICATION_TAG
 that also includes the image digest. This configures Auto Deploy to receive
 this artifact and use the updated CI_APPLICATION_TAG for deployments.
  `
    )
    .addJob(".auto-deploy", new Job().dependencies(["build"]))
    .addJob("dast_environment_deploy", new Job().dependencies(["build"]));

  const file = Deno.readTextFileSync("fixtures/Auto-DevOps.gitlab-ci.yml");
  assertEquals(gitlabci.toString(), file);
});
