// You can import your modules
// import index from '../src/index'

import nock from 'nock'
// Requiring our app implementation
import myProbotApp from '../src'
import { Probot } from 'probot'
// Requiring our fixtures
import issuePayload from './fixtures/issues.opened.json'
import pullRequestPayload from './fixtures/pr.opened.json'
import projectsListPayload from './fixtures/projects.list.json'
import columnsListPayload from './fixtures/columns.list.json'
const fs = require('fs')
const path = require('path')

const badConfig = ''
const unknownProjectConfig = 'project: "UNKNOWN"'
const unknownColumnConfig = `project: "Notre projet"
issues:
  column: "UNKNOWN"
pullRequests:
  column: "UNKNOWN"`
const minimalConfig = 'project: "Notre projet"'
const differentColumnConfig = `project: "Notre projet"
issues:
  column: "In progress"
pullRequests:
  column: "To do"`

const issueCardCreatedBody = { content_id: 611220258, content_type: 'Issue' }
const pullRequestCardCreatedBody = { content_id: 412471453, content_type: 'PullRequest' }

function toBase64 (string: string): string {
  return Buffer.from(string).toString('base64')
}

describe('My Probot app', () => {
  let probot: any
  let mockCert: string

  beforeAll((done: Function) => {
    fs.readFile(path.join(__dirname, 'fixtures/mock-cert.pem'), (err: Error, cert: string) => {
      if (err) return done(err)
      mockCert = cert
      done()
    })
  })

  beforeEach(() => {
    nock.disableNetConnect()
    probot = new Probot({ id: 123, cert: mockCert })
    // Load our app into probot
    probot.load(myProbotApp)
  })

  describe('when an issue is opened', () => {
    test('throws if the configuration is invalid', async () => {
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(badConfig) })

      // List projects
      const projectListScope = nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      await expect(probot.receive({ name: 'issues.opened', payload: issuePayload })).rejects.toThrow('`project` was not configured')
      expect(projectListScope.isDone()).toBeFalsy()
    })

    test('throws if the project is not found', async () => {
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(unknownProjectConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      const columnsListScope = nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      await expect(probot.receive({ name: 'issues.opened', payload: issuePayload })).rejects.toThrow('Project "UNKNOWN" was not found')
      expect(columnsListScope.isDone()).toBeFalsy()
    })

    test('throws if the column is not found', async () => {
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(unknownColumnConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      // Test that a comment is posted
      const createCardScope = nock('https://api.github.com')
        .post('/projects/columns/9006143/cards')
        .reply(201)

      await expect(probot.receive({ name: 'issues.opened', payload: issuePayload })).rejects.toThrow('Column "UNKNOWN" was not found')
      expect(createCardScope.isDone()).toBeFalsy()
    })

    test('creates a project card', async (done) => {
      // Test that we correctly return a test token
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(minimalConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      // Test that a comment is posted
      nock('https://api.github.com')
        .post('/projects/columns/9006143/cards', (body: any) => {
          done(expect(body).toMatchObject(issueCardCreatedBody))
          return true
        })
        .reply(201)

      // Receive a webhook event
      await probot.receive({ name: 'issues.opened', payload: issuePayload })
    })

    test('creates a project card in the correct column', async (done) => {
      // Test that we correctly return a test token
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(differentColumnConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      // Test that a comment is posted
      nock('https://api.github.com')
        .post('/projects/columns/9006144/cards', (body: any) => {
          done(expect(body).toMatchObject(issueCardCreatedBody))
          return true
        })
        .reply(201)

      // Receive a webhook event
      await probot.receive({ name: 'issues.opened', payload: issuePayload })
    })
  })

  describe('when an pull request is opened', () => {
    test('throws if the configuration is invalid', async () => {
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(badConfig) })

      // List projects
      const projectListScope = nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      await expect(probot.receive({ name: 'pull_request.opened', payload: pullRequestPayload })).rejects.toThrow('`project` was not configured')
      expect(projectListScope.isDone()).toBeFalsy()
    })

    test('throws if the project is not found', async () => {
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(unknownProjectConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      const columnsListScope = nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      await expect(probot.receive({ name: 'pull_request.opened', payload: pullRequestPayload })).rejects.toThrow('Project "UNKNOWN" was not found')
      expect(columnsListScope.isDone()).toBeFalsy()
    })

    test('throws if the column is not found', async () => {
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(unknownColumnConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      // Test that a comment is posted
      const createCardScope = nock('https://api.github.com')
        .post('/projects/columns/9006143/cards')
        .reply(201)

      await expect(probot.receive({ name: 'pull_request.opened', payload: pullRequestPayload })).rejects.toThrow('Column "UNKNOWN" was not found')
      expect(createCardScope.isDone()).toBeFalsy()
    })

    test('creates a project card', async (done) => {
      // Test that we correctly return a test token
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(minimalConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      // Test that a comment is posted
      nock('https://api.github.com')
        .post('/projects/columns/9006144/cards', (body: any) => {
          done(expect(body).toMatchObject(pullRequestCardCreatedBody))
          return true
        })
        .reply(201)

      // Receive a webhook event
      await probot.receive({ name: 'pull_request.opened', payload: pullRequestPayload })
    })

    test('creates a project card in the correct column', async (done) => {
      // Test that we correctly return a test token
      nock('https://api.github.com')
        .post('/app/installations/8554425/access_tokens')
        .reply(200, { token: 'test' })

      // Load configuration from target repo
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/.github/contents/.github/github-project-automation.yml')
        .reply(404)
        .get('/repos/nymous-experiments/demo-github-projects/contents/.github/github-project-automation.yml')
        .reply(200, { content: toBase64(differentColumnConfig) })

      // List projects
      nock('https://api.github.com')
        .get('/repos/nymous-experiments/demo-github-projects/projects')
        .reply(200, projectsListPayload)

      // List columns
      nock('https://api.github.com')
        .get('/projects/4436362/columns')
        .reply(200, columnsListPayload)

      // Test that a comment is posted
      nock('https://api.github.com')
        .post('/projects/columns/9006143/cards', (body: any) => {
          done(expect(body).toMatchObject(pullRequestCardCreatedBody))
          return true
        })
        .reply(201)

      // Receive a webhook event
      await probot.receive({ name: 'pull_request.opened', payload: pullRequestPayload })
    })
  })

  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/

// For more information about using TypeScript in your tests, Jest recommends:
// https://github.com/kulshekhar/ts-jest

// For more information about testing with Nock see:
// https://github.com/nock/nock
