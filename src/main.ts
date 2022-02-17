import { debug, getInput, info, setFailed } from "@actions/core"
import { getOctokit } from "@actions/github"
import { createWriteStream } from "fs"
import { ensureDir } from "fs-extra"
import { join } from "path/posix"
import { cwd } from "process"

// https://github.com/duhow/download-github-release-assets/blob/main/src/main.js
function regExpEscape(s: string) {
  return s.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&")
}
function wildcardToRegExp(s: string) {
  return new RegExp(`^${s.split(/\*+/).map(regExpEscape).join(".*")}$`)
}

async function run(): Promise<void> {
  try {
    const files = getInput("files") || "*"
    const repository = getInput("repository")
    const tag = getInput("tag")
    const target = getInput("target") || "."
    const token = getInput("token")

    if (process.env.NODE_ENV === "test") {
      debug(files)
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

    if (!release) {
      throw new Error(`Release ${tag} not found for ${repository}`)
    }

    if (release.data.assets.length === 0) {
      throw new Error(`Release ${tag} in ${repository} has no asset.`)
    }

    const fileGlob = files.split("\n")

    const assets =
      fileGlob[0] === "*"
        ? release.data.assets
        : release.data.assets.filter((asset) =>
            fileGlob.some((g) => asset.name.match(wildcardToRegExp(g)))
          )

    if (assets.length === 0) {
      throw new Error(
        `No asset to download in release ${release.data.tag_name}`
      )
    }

    const downloadPath = join(cwd(), target)

    await ensureDir(downloadPath)

    await Promise.all(
      assets.map(
        (asset) =>
          new Promise(async (resolve) => {
            const filePath = join(downloadPath, asset.name)

            // https://github.com/octokit/rest.js/issues/6#issuecomment-477800969
            const fileStream = createWriteStream(filePath)

            // Download the asset and pipe it into a file
            info(`Downloading ${asset.name} to ${filePath}`)

            const { data } = await github.rest.repos.getReleaseAsset({
              owner,
              repo,
              asset_id: asset.id,
              headers: {
                accept: "application/octet-stream"
              }
            })

            fileStream.write(Buffer.from(data as unknown as ArrayBuffer))
            fileStream.end()
            resolve(true)
          })
      )
    )

    info("Successfully downloaded assets")
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
