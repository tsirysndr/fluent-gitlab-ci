import { GitlabCI, Job } from "../mod.ts";

const mix = new Job().script("mix test");

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("elixir:latest")
  .services(["redis:latest", "postgres:latest"])
  .beforeScript(
    `
    mix local.rebar --force
    mix local.hex --force
    mix deps.get
  `
  )
  .addJob("mix", mix)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
