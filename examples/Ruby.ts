import { GitlabCI, Job } from "../mod.ts";

const rubocop = new Job().script("rubocop");

const rails = new Job().variables({
  DATABASE_URL: "postgresql://postgres:postgres@postgres:5432/$POSTGRES_DB",
}).script(`
    rails db:migrate
    rails db:seed
    rails test
  `);

const rspec = new Job().script("rspec spec");

const deploy = new Job().stage("deploy").environment("production").script(`
    gem install dpl
    dpl --provider=heroku --app=$HEROKU_APP_NAME --api-key=$HEROKU_PRODUCTION_KEY
  `);

const gitlabci = new GitlabCI()
  .image("ruby:latest")
  .services(["mysql:latest", "redis:latest", "postgres:latest"])
  .variables({
    POSTGRES_DB: "database_name",
  })
  .cache(["vendor/ruby"])
  .beforeScript(
    `
    ruby -v
    bundle config set --local deployment true 
    bundle install -j $(nproc)
  `
  )
  .addJob("rubocop", rubocop)
  .addJob("rails", rails)
  .addJob("rspec", rspec)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
