// Use built-in https module — available in all Node.js versions, no dependencies
const https = require('https')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS }
    return
  }

  await new Promise((resolve) => {
    https.get('https://api.avantikatechnology.com/api/tags', (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          context.res = {
            status: res.statusCode,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            body: JSON.stringify(JSON.parse(data)),
          }
        } catch {
          context.res = {
            status: 502,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Upstream parse error', models: [] }),
          }
        }
        resolve()
      })
    }).on('error', (err) => {
      context.res = {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message, models: [] }),
      }
      resolve()
    })
  })
}
