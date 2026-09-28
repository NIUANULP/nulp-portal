const proxyHeaders = require('../proxy/proxyUtils.js')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const envHelper = require('../helpers/environmentVariablesHelper.js')
const contentProxyUrl = envHelper.CONTENT_PROXY_URL
const contentServiceBaseUrl = envHelper.CONTENT_URL
const { logger } = require('@project-sunbird/logger');
const proxyUtils = require('../proxy/proxyUtils.js')
const mockData = require("./mockdata/asset.json")
const session = require('express-session')
const { memoryStore } = require('../helpers/keyCloakHelper')
const axios = require('axios')

const searchPatterns = ['/content/v1/search', '/course/v1/search', '/composite/v1/search']

const promoteCache = new Map()

function titleScore(title, query) {
    const t = (title || '').trim().toLowerCase()
    const q = (query || '').trim().toLowerCase()
    if (t === q) return 0
    if (t.startsWith(q)) return 1
    if (t.includes(q)) return 2
    return 3
}

async function fetchTopExactMatch(query, filters) {
    try {
        const body = {
            request: {
                filters: Object.assign({}, filters || {}, { name: { contains: query } }),
                limit: 10,
                query: query,
                offset: 0
            }
        }
        const response = await axios.post(contentProxyUrl + '/api/content/v1/search', body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        })
        const content = response.data && response.data.result && response.data.result.content
        if (!Array.isArray(content) || content.length === 0) return null
        let best = null
        let bestScore = 3
        for (const item of content) {
            const score = titleScore(item.name, query)
            if (score < bestScore) {
                bestScore = score
                best = item
            }
            if (score === 0) break
        }
        return best
    } catch (err) {
        logger.error({ msg: 'error fetching top exact match', err: err.message })
        return null
    }
}

async function promoteExactMatch(data, query, searchRequest) {
    if (!data || !data.result || !Array.isArray(data.result.content) || !query) return
    const offset = searchRequest.offset || 0
    const key = query.trim().toLowerCase()
    if (offset === 0) {
        let promoted = promoteCache.get(key)
        if (!promoted) {
            promoted = await fetchTopExactMatch(query, searchRequest.filters)
            promoteCache.set(key, promoted)
        }
        if (promoted) {
            const id = promoted.identifier || promoted.id
            const existing = data.result.content.some((c) => (c.identifier || c.id) === id)
            if (!existing) {
                data.result.content = [promoted].concat(data.result.content)
                data.result.count = (data.result.count || data.result.content.length) + 1
            } else {
                data.result.content = [promoted].concat(
                    data.result.content.filter((c) => (c.identifier || c.id) !== id)
                )
            }
        }
    } else {
        const promoted = promoteCache.get(key)
        if (promoted) {
            const id = promoted.identifier || promoted.id
            const filtered = data.result.content.filter((c) => (c.identifier || c.id) !== id)
            if (filtered.length !== data.result.content.length) {
                data.result.content = filtered
                data.result.count = Math.max((data.result.count || filtered.length) - 1, filtered.length)
            }
        }
    }
}

module.exports = function (app) {
    const proxyReqPathResolverMethod = function (req) {
        return require('url').parse(contentProxyUrl + req.originalUrl).path
    }

    const searchUserResDecorator = async function (proxyRes, proxyResData, req) {
        try {
            if (req.method !== 'POST' || !searchPatterns.some((p) => req.originalUrl.includes(p))) {
                return proxyResData
            }
            const searchRequest = req.body && req.body.request
            if (!searchRequest || !searchRequest.query) return proxyResData
            const data = JSON.parse(proxyResData.toString('utf8'))
            await promoteExactMatch(data, searchRequest.query, searchRequest)
            return JSON.stringify(data)
        } catch (err) {
            return proxyResData
        }
    }

    // app.all('/api/content/v1/search', proxyObj());

    // app.all('/api/content/v1/create', proxyObj());

    // app.all('/api/content/v1/upload/:id', proxyObj());

    // app.all('/api/content/v1/read/:id', proxyObj());

    // app.all('/api/asset/v1/upload/:id', proxyObj());

    if (envHelper.KONG_DEVICE_REGISTER_ANONYMOUS_TOKEN === 'true') {
        app.use('/api/*', session({
            secret: '717b3357-b2b1-4e39-9090-1c712d1b8b64',
            resave: false,
            cookie: {
                maxAge: envHelper.sunbird_anonymous_session_ttl
            },
            saveUninitialized: false,
            store: memoryStore
        }), bodyParser.json({ limit: '10mb' }), proxy(contentProxyUrl, {
            proxyReqPathResolver: proxyReqPathResolverMethod,
            userResDecorator: searchUserResDecorator
        }))
    } else {
        app.use('/api/*', bodyParser.json({ limit: '10mb' }), proxy(contentProxyUrl, {
            proxyReqPathResolver: proxyReqPathResolverMethod,
            userResDecorator: searchUserResDecorator
        }))
    }

}


function proxyObj() {
    return proxy(contentProxyUrl, {
        proxyReqOptDecorator: proxyUtils.decoratePublicRequestHeaders(),
        proxyReqPathResolver: function (req) {
            let urlParam = req.originalUrl;
            let query = require('url').parse(req.url).query;
            if (query) {
                return require('url').parse(contentProxyUrl + urlParam + '?' + query).path
            } else {
                return require('url').parse(contentProxyUrl + urlParam).path
            }
        },
        userResDecorator: (proxyRes, proxyResData, req, res) => {
            try {
                logger.info({ msg: 'proxyObj' + req.method + ' - ' + req.url });
                const data = JSON.parse(proxyResData.toString('utf8'));
                if (req.method === 'GET' && proxyRes.statusCode === 404 && (typeof data.message === 'string' && data.message.toLowerCase() === 'API not found with these values'.toLowerCase())) res.redirect('/')
                else return proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req, res, data);
            } catch (err) {
                logger.error({ msg: 'Error occurred while featching the data' });
                return proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req, res);
            }
        }
    })
}

