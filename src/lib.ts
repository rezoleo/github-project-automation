import { Context, Octokit } from 'probot' // eslint-disable-line no-unused-vars

interface DefaultConfig {
  issues: { column: string }
  pullRequests: { columnDraft: string, column: string }
}

type Config = DefaultConfig & {project: string}

const DEFAULT_CONFIG: DefaultConfig = {
  issues: { column: 'To do' },
  pullRequests: {
    columnDraft: 'In progress',
    column: 'Review in progress'
  }

}

export async function getConfig (context: Context) {
  const config = await context.config<DefaultConfig>('github-project-automation.yml', DEFAULT_CONFIG) as Config
  if (!config.project) {
    throw new Error('`project` was not configured')
  }
  return config
}

export async function findProject (context: Context, projectName: string) {
  const listProjectsOptions = context.github.projects.listForRepo.endpoint.merge(context.repo())
  for await (const response of context.github.paginate.iterator(listProjectsOptions)) {
    for (const project of response.data as Octokit.ProjectsListForRepoResponse) {
      if (project.name === projectName) {
        context.log.debug(`Found the project "${project.name}" (${project.id})`)
        return project
      }
    }
  }
  throw new Error(`Project "${projectName}" was not found in the repository "${context.repo().owner}/${context.repo().repo}"`)
}

export async function findColumn (context: Context, project: Octokit.ProjectsGetResponse, columnName: string) {
  const listColumnsOptions = context.github.projects.listColumns.endpoint.merge({ project_id: project.id })
  for await (const response of context.github.paginate.iterator(listColumnsOptions)) {
    for (const column of response.data as Octokit.ProjectsListColumnsResponse) {
      if (column.name === columnName) {
        context.log.debug(`Found the column "${column.name}" (${column.id})`)
        return column
      }
    }
  }
  throw new Error(`Column "${columnName}" was not found in the project "${project.name}" of repository "${context.repo().owner}/${context.repo().repo}"`)
}
