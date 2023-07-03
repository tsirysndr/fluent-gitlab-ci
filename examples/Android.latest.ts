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

console.log(gitlabci.toString());
