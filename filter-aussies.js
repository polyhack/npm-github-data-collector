const AU_LOCATION_REGEX =
        /\Wau(s|st)?\W|australia|straya|down under|hobart|sydney|melbourne|brisbane|perth|darwin|adelaide|canberra|\W(nsw|vic|qld|new south wales|victoria|queensland|western australia|northern territory|south australia|tasmania)\W/i
      // secondary guess, does your blog UI end with .au?
    , AU_BLOG_REGEX     = /\.au$/i
    , AU_BLACKLIST_REGEX = /fl|florida/i

function isAussie (user) {
  if (!user) return false
  if (user.location && AU_LOCATION_REGEX.test(user.location) && !AU_BLACKLIST_REGEX.test(user.location)) return true
  if (user.blog && AU_BLOG_REGEX.test(user.blog)) return true
  return false
}

function filterAussies (users) {
  return users.filter(isAussie)
}

module.exports = filterAussies
