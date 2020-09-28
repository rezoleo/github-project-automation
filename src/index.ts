import { Application } from 'probot' // eslint-disable-line no-unused-vars
import { findColumn, findProject, getConfig } from './lib'

export = (app: Application) => {
  app.on('issues.opened', async (context) => {
    const config = await getConfig(context)

    const issueTitle = context.payload.issue.title
    const issueId = context.payload.issue.id

    context.log.debug(`New issue opened: "${issueTitle}" (${issueId})`)

    const project = await findProject(context, config.project)

    const column = await findColumn(context, project, config.issues.column)

    await context.github.projects.createCard({ column_id: column.id, content_id: issueId, content_type: 'Issue' })
    context.log.debug(`Added issue #${context.payload.issue.number} to column ${column.name} of project ${project.name}`)
  })

  app.on('pull_request.opened', async (context) => {
    const config = await getConfig(context)

    const isPullRequestDraft: boolean = context.payload.pull_request.draft
    const columnPullRequest: string = isPullRequestDraft ? config.pullRequests.columnDraft : config.pullRequests.column

    const pullRequestTitle = context.payload.pull_request.title
    const pullRequestId = context.payload.pull_request.id

    context.log.debug(`New PR opened: "${pullRequestTitle}" (${pullRequestId})`)

    const project = await findProject(context, config.project)

    const column = await findColumn(context, project, columnPullRequest)

    await context.github.projects.createCard({
      column_id: column.id,
      content_id: pullRequestId,
      content_type: 'PullRequest'
    })
    context.log.debug(`Added PR #${context.payload.pull_request.number} to column ${column.name} of project ${project.name}`)
  })
}
