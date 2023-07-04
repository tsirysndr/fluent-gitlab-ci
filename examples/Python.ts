import { GitlabCI, Job } from "../mod.ts";

const test = new Job().script(`
    pip install ruff tox  # you can also use tox
    pip install --editable ".[test]"
    tox -e py,ruff
  `);

const run = new Job().script("pip install .").artifacts({
  paths: ["build/*"],
});

const page = new Job()
  .script(
    `
    pip install sphinx sphinx-rtd-theme
    cd doc
    make html
    mv build/html/ ../public/
  `
  )
  .artifacts({
    paths: ["public"],
  })
  .rules([
    {
      if: "$CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH",
    },
  ]);

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("python:latest")
  .variables({
    PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip",
  })
  .cache([".cache/pip", "venv/"])
  .beforeScript(
    `
    python --version ; pip --version
    pip install virtualenv
    virtualenv venv
    source venv/bin/activate
  `
  )
  .addJob("test", test)
  .addJob("run", run)
  .addJob("page", page)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
