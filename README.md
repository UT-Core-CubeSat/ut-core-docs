# Website

<!-- sudo docker run -it --rm -v $(pwd):/mnt debian:latest bash -->

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

Access the website here: https://ut-core-cubesat.github.io/ut-core-docs/

## Install Dependancies (Ubuntu/Debian)

```bash
sudo apt install npm
cd ut-core-docs/
npm install yarn
npm yarn
```

<!-- To approve `npm` scripts -->
<!--  -->
<!-- ```bash -->
<!-- npm approve-scripts --all -->
<!-- ``` -->



<!-- ## Update Dependancies -->
<!--  -->
<!-- ```bash -->
<!-- npx npm-check-updates -u -->
<!-- ``` -->

<!-- ## Installation -->
<!--  -->
<!-- ```bash -->
<!-- npx yarn -->
<!-- ``` -->

## Build

```bash
npx yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Local Development

```bash
npx yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Deployment

Using SSH:

```bash
USE_SSH=true npx yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npx yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.


## Markdown Formatting

For Docusaurus Markdown Features, reference this page:

https://docusaurus.io/docs/markdown-features
