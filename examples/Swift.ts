import { GitlabCI, Job } from "../mod.ts";

const buildProject = new Job()
  .stage("build")
  .script(
    `
    xcodebuild clean -project ProjectName.xcodeproj -scheme SchemeName | xcpretty
    xcodebuild test -project ProjectName.xcodeproj -scheme SchemeName -destination 'platform=iOS Simulator,name=iPhone 8,OS=11.3' | xcpretty -s
  `
  )
  .tags(["ios_11-3", "xcode_9-3", "macos_10-13"]);

const archiveProject = new Job()
  .stage("archive")
  .script(
    `
    xcodebuild clean archive -archivePath build/ProjectName -scheme SchemeName
    xcodebuild -exportArchive -exportFormat ipa -archivePath "build/ProjectName.xcarchive" -exportPath "build/ProjectName.ipa" -exportProvisioningProfile "ProvisioningProfileName"
  `
  )
  .rules([
    {
      if: "$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH",
    },
  ])
  .artifacts({
    paths: ["build/ProjectName.ipa"],
  })
  .tags(["ios_11-3", "xcode_9-3", "macos_10-13"]);

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .stages(["build", "test", "archive", "deploy"])
  .addJob("build_project", buildProject)
  .addJob("archive_project", archiveProject)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
