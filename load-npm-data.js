// if your GitHub location field matches this then we'll guess you're Aussie
const GITHUB_REPO_REGEX = /github.com[:\/]([\.\-\w]+)\/([^$\/\.]+)/

const npm = require('npm')

function matchGitHubRepo (npmPackage, repo) {
  var match = repo
    && typeof repo.url == 'string'
    && repo.url.match(GITHUB_REPO_REGEX)

  return match && {
      githubUser : match[1]
    , githubRepo : match[2]
    , npmPackage : npmPackage
  }
}

// load the list of all npm libs with 'repo' pointing to GitHub
function loadNpmData (callback) {
  var repositories = []
    , allPackages  = []

  npm.load(function (err) {
    if (err) return callback(err)

    npm.registry.get('/-/all', function (err, data) {
      if (err) return callback(err)

      Object.keys(data).forEach(function (k) {
        var repo = matchGitHubRepo(data[k].name, data[k].repository)
        if (repo)
          repositories.push(repo)

        allPackages.push({
            name        : data[k].name
          , maintainers : (data[k].maintainers || []).map(function (m) { return m.name })
          , githubUser  : repo ? repo.githubUser : null
          , githubRepo  : repo ? repo.githubRepo : null
          , description : data[k].description
        })
      })

      callback(null, { repositories: repositories, allPackages: allPackages })
    })
  })
}

module.exports = loadNpmData