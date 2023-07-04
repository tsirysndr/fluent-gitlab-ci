import { GitlabCI, Job } from "../mod.ts";

const defaultJob = new Job()
  .image("ubuntu:20.04")
  .services(["mysql:8.0"])
  .cache(["~/.cache/pip/"]).beforeScript(`
    apt -y update
    apt -y install apt-utils
    apt -y install net-tools python3.8 python3-pip mysql-client libmysqlclient-dev
    apt -y upgrade
    pip3 install -r requirements.txt
  `);

const migrations = new Job().stage("build").script(`
    python3 manage.py makemigrations
    python3 manage.py migrate
    python3 manage.py check
  `);

const djangoTests = new Job().stage("test").script(`
    echo "GRANT ALL on *.* to '\${MYSQL_USER}';"| mysql -u root --password="\${MYSQL_ROOT_PASSWORD}" -h mysql
    python3 manage.py test
  `);

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .variables({
    MYSQL_DATABASE: "$MYSQL_DB",
    MYSQL_ROOT_PASSWORD: "$MYSQL_PASS",
    MYSQL_USER: "$MYSQL_USER",
    MYSQL_PASSWORD: "$MYSQL_PASS",
  })
  .addJob("default", defaultJob)
  .addJob("migrations", migrations)
  .addJob("django-tests", djangoTests)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
