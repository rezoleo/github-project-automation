# GitHub project automation

> A GitHub App built with [Probot](https://github.com/probot/probot) that automates your GitHub Project by adding new issues and PRs

## Installation

Install the app (TODO), then create a `.github/github-project-automation.yml` file with the following content:
```yaml
project: "Name of your project (mandatory)"
issues:
  column: "Column to send issues to (default 'To do')"
pullRequests:
  column: "Column to send PRs to (default 'In progress')"
```

The app will then automatically add any new issue or PR to the configured project.

Note: only repository projects are supported at the moment, support for organization projects is planned.

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
