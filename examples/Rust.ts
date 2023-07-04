import { GitlabCI, Job } from "../mod.ts";

const test = new Job().script(`
    rustc --version && cargo --version
    cargo test --workspace --verbose
  `);

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("rust:latest")
  .addJob("test:cargo", test)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
