<p align="center">
  <a href="https://github.com/plasmo-corp/download-release-asset/actions"><img alt="download-release-asset status" src="https://github.com/plasmo-corp/download-release-asset/workflows/build-test/badge.svg"></a>
</p>

# Download release assets

Use this action to download assets from a release in any github project that you can access.

## Implementation notes

We decided to build this action because when searching for a "github release file download" action in a couple of search engine, we couldn't find one that fits our need.

While implementing the code to download the asset however, we found this issue [octokit/rest.js/issues/6#issuecomment-477800969](https://github.com/octokit/rest.js/issues/6#issuecomment-477800969), which has a reference to an issue pointing to [github-release-assets](https://github.com/duhow/download-github-release-assets).

Since that action does not use TypeScript, we decided to go ahead with the release of our own.

## Usage

To download any `test-*.txt` file into the pwd, from the latest release within the current repository:

```yaml
steps:
  - uses: plasmo-corp/download-release-asset@v0.0.0
    with:
      files: test-*.txt
```

To download any `test-*.md` and `foo-*.zip` file from another repository, with a specific release tag, into a `download` directory:

```yaml
steps:
  - uses: plasmo-corp/download-release-asset@v0.0.0
    with:
      files: |
        test-*.md
        foo-*.zip
      repository: plasmo-corp/test-repo
      tag: v1.0.0
      target: download/
      token: ${{ secrets.GITHUB_TOKEN }}
```

## Acknowledgements

- [github-release-assets](https://github.com/duhow/download-github-release-assets)
- [fetch-gh-release-asse](https://github.com/dsaltares/fetch-gh-release-asset)
