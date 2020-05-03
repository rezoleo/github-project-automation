import { Application } from 'probot' // eslint-disable-line no-unused-vars
import { findColumn, findProject } from './lib'

const PROJECT_NAME = 'Notre projet'
const COLUMN_NAME = 'In progress'

export = (app: Application) => {
  app.on('issues.opened', async (context) => {
    const issueTitle = context.payload.issue.title
    const issueId = context.payload.issue.id

    context.log.debug(`New issue opened: "${issueTitle}" (${issueId})`)

    const project = await findProject(context, PROJECT_NAME)

    const column = await findColumn(context, project, COLUMN_NAME)

    await context.github.projects.createCard({ column_id: column.id, content_id: issueId, content_type: 'Issue' })
  })

  app.on('pull_request.opened', async (context) => {
    const pullRequestTitle = context.payload.pull_request.title
    const pullRequestId = context.payload.pull_request.id

    context.log.debug(
        `New PR opened: "${pullRequestTitle}" (${pullRequestId})`
    )

    const project = await findProject(context, PROJECT_NAME)

    const column = await findColumn(context, project, COLUMN_NAME)

    await context.github.projects.createCard({ column_id: column.id, content_id: pullRequestId, content_type: 'PullRequest' })
  })
}
