import { GitlabCI, Job } from "../mod.ts ";

const dockerBuild = new Job()
  .image("docker:latest")
  .stage("build")
  .services(["docker:dind"])
  .beforeScript(
    'docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" $CI_REGISTRY'
  )
  .script(
    `
if [[ "$CI_COMMIT_BRANCH" == "$CI_DEFAULT_BRANCH" ]]; then
  tag=""
  echo "Running on default branch '$CI_DEFAULT_BRANCH': tag = 'latest'"
else
  tag=":$CI_COMMIT_REF_SLUG"
  echo "Running on branch '$CI_COMMIT_BRANCH': tag = $tag"
fi
  `,
    { multiline: true }
  )
  .script(
    `
    docker build --pull -t "$CI_REGISTRY_IMAGE\${tag}" .
    docker push "$CI_REGISTRY_IMAGE\${tag}"
  `
  )
  .rules([
    {
      if: "$CI_COMMIT_BRANCH",
      exists: ["Dockerfile"],
    },
  ]);

const gitlabci = new GitlabCI().addJob("docker_build", dockerBuild);

console.log(gitlabci.toString());
