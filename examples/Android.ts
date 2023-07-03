import { GitlabCI, Job } from "../mod.ts";

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

console.log(gitlabci.toString());