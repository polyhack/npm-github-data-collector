const GITHUB_CALLS_PER_HOUR = 4500

const fs              = require('fs')
    , async           = require('async')
    , rateLimit       = require('function-rate-limit')
    , loadNpmData     = require('./load-npm-data')
    , filterAussies   = require('./filter-aussies')
    , fetchGithubData = rateLimit(
          GITHUB_CALLS_PER_HOUR
        , 1000 * 60 * 60
        , require('./fetch-github-data')
      )
    , config          = require('./config')

/* ./config.json needs to look like this:
{
    "allPackagesOutput"  : "/path/to/allpackages.json"
  , "repositoriesOutput" : "/path/to/repositories.json"
  , "githubOutput"       : "/path/to/githubusers.json"
  , "aussieOutput"       : "/path/to/aussieOutput.json"
  , "githubAuthToken"    : "yourgithubauthtoken"
}

where githubAuthToken can be obtained with something like:
curl -i -u <your_username> -d '{"scopes": ["repo"]}' https://api.github.com/authorizations
(not that it needs "repo" scope)
*/

function write (location, data) {
  fs.writeFile(
      location
    , JSON.stringify(data, null, 2)
    , function (err) {
        if (err)
          console.error(err)
        console.log('Wrote', location)
      }
  )
}

function githubUsers (repositories) {
  var users   = []

  repositories.forEach(function (repo) {
    if (users.indexOf(repo.githubUser) == -1)
      users.push(repo.githubUser)
  })

  return users
}

function fetchUsers (users, callback) {
  async.map(
      users
    , function (user, callback) {
        fetchGithubData(config.githubAuthToken, user, function (err, data) {
          if (err || !user) {
            console.error(err || 'No user data for ' + user)
            return callback()
          }

          if (user.message) {
            console.error('GitHub:', user.message)
            return callback()
          }

          callback(null, data)
        })
      }
    , callback
  )
}

loadNpmData(function (err, data) {
  if (err)
    return console.error(err)

  write(config.allPackagesOutput, data.allPackages)
  write(config.repositoriesOutput, data.repositories)

  fetchUsers(githubUsers(data.repositories), function (err, data) {
    if (err)
      return console.error(err)

    write(config.githubOutput, data)

    write(config.aussieOutput, filterAussies(data))
  })
})