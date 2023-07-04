import { GitlabCI, Job } from "../mod.ts";

const format = new Job().stage("test").script(`
    go fmt $(go list ./... | grep -v /vendor/)
    go vet $(go list ./... | grep -v /vendor/)
    go test -race $(go list ./... | grep -v /vendor/)
  `);

const compile = new Job()
  .stage("build")
  .script(
    `
    mkdir -p mybinaries
    go build -o mybinaries ./...
  `
  )
  .artifacts({
    paths: ["mybinaries"],
  });

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("golang:latest")
  .stages(["build", "test", "deploy"])
  .addJob("format", format)
  .addJob("compile", compile)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
