import { GitlabCI, Job } from "../mod.ts";

const testAsync = new Job().script(`
     npm install
     node ./specs/start.js ./specs/async.spec.js
  `);

const testDb = new Job().script(`
  npm install
  node ./specs/start.js ./specs/db-postgres.spec.js
`);

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("node:latest")
  .services(["mysql:latest", "redis:latest", "postgres:latest"])
  .cache(["node_modules/"])
  .addJob("test_async", testAsync)
  .addJob("test_db", testDb)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
