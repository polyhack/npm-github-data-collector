// if your GitHub location field matches this then we'll guess you're Aussie
const GITHUB_REPO_REGEX = /github.com[:\/]([\.\-\w]+)\/([^$\/\.]+)/
    , NPM_ALL_PACKAGES_URL = 'https://skimdb.npmjs.com/registry/_all_docs'
    , NPM_SINGLE_PACKAGE_URL = 'https://registry.npmjs.org/{packageId}/latest'
    , request = require('request').defaults({json:true})
    , async = require('async');

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

function getPackageData (repositories, allPackages, packageData, callback) {
  request(NPM_SINGLE_PACKAGE_URL.replace('{packageId}', packageData.id), function (err, response, data) {
    if (err) {
      // log and continue usually just a timeout, possibly needs retry logic
      console.log('error getting data for package: ' + packageData.id, err.message)
      return callback()
    }

    // Bad maintainers property there are MANY just skip for much speed increase
    if (!data.maintainers || !Array.isArray(data.maintainers)) {
      return callback()
    }

    var repo = matchGitHubRepo(data.name, data.repository);

    if (repo) {
      repositories.push(repo)
    }

    allPackages.push({
        name        : data.name
      , maintainers : (data.maintainers || []).map(function (m) { return m && m.name })
      , githubUser  : repo ? repo.githubUser : null
      , githubRepo  : repo ? repo.githubRepo : null
      , description : data.description
    })

    callback()
  })
}

function getAllPackages (callback) {
  var repositories = []
    , allPackages  = []

  // https://github.com/npm/npm-registry-couchapp/issues/162
  request(NPM_ALL_PACKAGES_URL, function(err, response, body){
    if (err) {
      return callback(err);
    }

    if (!body || !body.rows) {
      body = { rows: [] };
    }

    async.mapLimit(body.rows, 10, getPackageData.bind(null, repositories, allPackages), function (err) {
      if (err) {
        return callback(err);
      }

      callback(null, { repositories: repositories, allPackages: allPackages })
    })
  })
}

module.exports = getAllPackages