// Use built-in https module — available in all Node.js versions, no dependencies
const https = require('https')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS }
    return
  }

  // Force stream:false so we get a single JSON response back
  const body = JSON.stringify({ ...req.body, stream: false })

  await new Promise((resolve) => {
    const options = {
      hostname: 'api.avantikatechnology.com',
      path: '/api/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const upstream = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          // If upstream returned an error status, include its body for debugging
          if (res.statusCode >= 400) {
            console.error('Upstream error', { status: res.statusCode, body: data })
            context.res = {
              status: res.statusCode,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
              body: JSON.stringify({ upstreamStatus: res.statusCode, upstreamBody: data }),
            }
          } else {
            context.res = {
              status: res.statusCode,
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
              body: JSON.stringify(JSON.parse(data)),
            }
          }
        } catch (err) {
          // Upstream returned non-JSON or parsing failed — return raw body and status
          console.error('Error parsing upstream response', err)
          const firstLine = data.split('\n').find(l => l.trim().startsWith('{'))
          context.res = {
            status: res.statusCode || 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            body: firstLine ?? JSON.stringify({ response: data, done: true }),
          }
        }
        resolve()
      })
    })

    upstream.on('error', (err) => {
      context.res = {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      }
      resolve()
    })

    upstream.write(body)
    upstream.end()
  })
}
