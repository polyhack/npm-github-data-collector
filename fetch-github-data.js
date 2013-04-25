const GITHUB_USER_API_URL = 'https://api.github.com/users/{user}'

const request = require('request')

var requestPool = { maxSockets: 20 }

function fetchGithubData (githubToken, user, callback) {

  var opts = {
          url     : GITHUB_USER_API_URL.replace('{user}', user)
        , headers : {
              authorization : 'token ' + githubToken
            , 'user-agent'  : 'npm user data fetcher <https://github.com/polyhack/>'
          }
        , json    : true
        , pool    : requestPool
      }

    , handle = function (err, response, body) {
        if (err)
          return callback('Error requesting repo data from GitHub for ' + user + ': ' + err)

        callback(null, body)
      }

  request(opts, handle)
}

module.exports = fetchGithubData