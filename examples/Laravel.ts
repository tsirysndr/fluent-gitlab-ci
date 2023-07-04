import { GitlabCI, Job } from "../mod.ts";

const test = new Job().script(`
    php vendor/bin/phpunit --coverage-text --colors=never
    npm test
  `);

const deploy = new Job()
  .stage("deploy")
  .script('echo "Define your deployment script!"')
  .environment("production");

const gitlabci = new GitlabCI()
  .image("php:latest")
  .services(["mysql:latest"])
  .variables({
    MYSQL_DATABASE: "project_name",
    MYSQL_ROOT_PASSWORD: "secret",
  })
  .cache(["vendor/", "node_modules/"])
  .beforeScript(
    `
    apt-get update -yqq
    apt-get install gnupg -yqq
    curl -sL https://deb.nodesource.com/setup_8.x | bash -
    apt-get install git nodejs libcurl4-gnutls-dev libicu-dev libmcrypt-dev libvpx-dev libjpeg-dev libpng-dev libxpm-dev zlib1g-dev libfreetype6-dev libxml2-dev libexpat1-dev libbz2-dev libgmp3-dev libldap2-dev unixodbc-dev libpq-dev libsqlite3-dev libaspell-dev libsnmp-dev libpcre3-dev libtidy-dev -yqq
    docker-php-ext-install mbstring pdo_mysql curl json intl gd xml zip bz2 opcache
    pecl install xdebug
    docker-php-ext-enable xdebug
    curl -sS https://getcomposer.org/installer | php
    php composer.phar install
    npm install
    cp .env.testing .env
    npm run build
    npm run dev
    php artisan key:generate
    php artisan config:cache
    php artisan migrate
    php artisan db:seed
  `
  )
  .addJob("test", test)
  .addJob("deploy", deploy);

console.log(gitlabci.toString());
