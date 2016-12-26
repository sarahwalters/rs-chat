## rs-chat

### Setup
- Install node & npm
    - with NVM (a nice version manager): [instructions](https://github.com/creationix/nvm)
    - or: `sudo apt-get install nodejs` / `brew install node`
- Install nodemon
    - `npm install -g nodemon` (the `-g` makes this a global installation -- system-wide, not specific to this app)
- Install jscs
    - `npm install -g jscs` (same deal with the `-g`)

### Running locally
- Clone the repository
- From the repository:
    - `npm install` (this pulls the dependencies from the `package.json` into a `node_modules` directory)
    - `nodemon` (this starts a server which watches the files in the repository and restarts when they change)
- Browse to [localhost:3000](localhost:3000)

### Adding dependencies
- For an app dependency named `package`
    - `npm install --save package` (the `--save` adds the package to the app's `package.json`)
- For a process / development dependency named `package`
    - `npm install --save-dev package` (the `--save-dev` works like `--save` but only pulls the dependency down during `npm install` when we're in a development environment)

### Devtools
- From the repository:
    - To run the test suite: `npm test` (tests don't exist yet)
    - To lint: `npm run lint`
