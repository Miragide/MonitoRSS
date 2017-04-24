const FetchStream = require('fetch').FetchStream
const cloudscraper = require('cloudscraper') // For cloudflare

module.exports = function (link, feedparser, callback) {
  let attempts = 0;

  (function requestStream() {
    const request = new FetchStream(link, {timeout: 15000})

    request.on('error', function(err) {
      if (attempts < 3) {
        attempts++;
        return requestStream();
      }
      else return callback(err);
    })

    request.on('meta', function (meta) {
      if (meta.status !== 200) {
        if (meta.responseHeaders.server && meta.responseHeaders.server.includes('cloudflare')) {
          cloudscraper.get(link, function(err, res, body) { // For cloudflare
            if (err) return callback(err);
            let Readable = require('stream').Readable
            let feedStream = new Readable
            feedStream.push(body)
            feedStream.push(null)
            feedStream.pipe(feedparser)
          })
        }
        else return this.emit('error', new Error(`Bad status code (${meta.status})`));
      }
      else this.pipe(feedparser)
    })
  })()
}
