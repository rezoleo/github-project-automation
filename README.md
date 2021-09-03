# GitHub project automation

> A GitHub App built with [Probot](https://github.com/probot/probot) that automates your GitHub Project by adding new
> issues and PRs

## Installation

Install the GitHub app or create a new one (TODO), then create a `.github/github-project-automation.yml` file with the following content:
```yaml
project: "Name of your project (mandatory)"

# The rest of the configuration is optional
issues:
  column: "Column to send issues to (default 'To do')"
pullRequests:
  columnDraft: "Column to send Draft PRs to (default 'In progress')"
  column: "Column to send PRs to (default 'Review in progress')"
```

The app will then automatically add any new issue or PR to the configured project.

Note: only repository projects are supported at the moment, support for organization projects is planned.

## Deployment

If you want to run the code yourself you can follow Probot documentation for a standard install, or use the provided
Dockerfile (or the image `rezoleo/github-project-automation`). The following `docker-compose.yml` configuration is provided
as a reference:

```yaml
version: '3'

services:
  probot:
    image: rezoleo/github-project-automation
    ports:
      - 3000:3000
    environment:
      APP_ID: 12345
      WEBHOOK_SECRET: "this is a secret"
      PRIVATE_KEY: |
        -----BEGIN RSA PRIVATE KEY-----
        your private key
        -----END RSA PRIVATE KEY-----
      #LOG_LEVEL: debug  # if you need to debug something, default is "info"
```

## Development

You need Node >= 12.16

```sh
# Install dependencies
npm install

# Run with hot reload
npm run build:watch

# Compile and run
npm run build
npm run start
```

## Contributing

If you have suggestions for how github-project-automation could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2020 Thomas Gaudin <thomas.gaudin@centraliens-lille.org>
