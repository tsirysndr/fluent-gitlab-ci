import { GitlabCI, Job } from "../mod.ts";

const test = new Job().script("sbt clean test");

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("openjdk:8")
  .beforeScript(
    `
  apt-get update -yqq
  apt-get install apt-transport-https -yqq
  echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | tee -a /etc/apt/sources.list.d/sbt.list
  mkdir -p /root/.gnupg
  gpg --recv-keys --no-default-keyring --keyring gnupg-ring:/etc/apt/trusted.gpg.d/scalasbt-release.gpg --keyserver hkp://keyserver.ubuntu.com:80 2EE0EA64E40A89B84B2DF73499E82A75642AC823
  chmod 644 /etc/apt/trusted.gpg.d/scalasbt-release.gpg
  apt-get update -yqq
  apt-get install sbt -yqq
  sbt sbtVersion
`
  )
  .addJob("test", test)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
