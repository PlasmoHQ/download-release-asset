import { debug, getInput, setFailed } from "@actions/core"
import { getOctokit } from "@actions/github"
import { createWriteStream } from "fs"
import { join } from "path/posix"
import { cwd } from "process"
import { Stream } from "stream"

async function run(): Promise<void> {
  try {
    const file = getInput("file", { required: true })
    const repository = getInput("repository")
    const tag = getInput("tag")
    const target = getInput("target") || file
    const token = getInput("token")

    if (process.env.NODE_ENV === "test") {
      debug(file)
      return
    }

    const github = getOctokit(token)

    const [owner, repo] = repository.split("/")

    const release = await (tag === "latest"
      ? github.rest.repos.getLatestRelease({
          owner,
          repo
        })
      : github.rest.repos.getReleaseByTag({
          owner,
          repo,
          tag
        }))

    const asset = release.data.assets.find((asset) => asset.name === file)

    if (!asset) {
      throw new Error(
        `Asset ${file} not found in release ${release.data.tag_name}`
      )
    }

    // Download the asset and pipe it into a file
    const response = await github.rest.repos.getReleaseAsset({
      mediaType: {
        format: "octet-stream"
      },
      owner,
      repo,
      asset_id: asset.id,
      headers: {
        accept: "application/octet-stream"
      }
    })

    const filePath = !target
      ? asset.name
      : target.endsWith("/")
      ? join(target, asset.name)
      : target

    const fileStream = createWriteStream(join(cwd(), filePath))

    await new Promise((resolve, reject) => {
      ;(response.data as unknown as Stream).pipe(fileStream)

      fileStream.on("finish", resolve)
      fileStream.on("error", reject)
    })
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
