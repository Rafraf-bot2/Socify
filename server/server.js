const { createDatabaseIfNotExist, insertUserInDatabase, insertMessageInDiscussion, getDiscussionsByUserID, getDiscussionUsers } = require('./modules/database')
const { getArtistTopTracks, getTracksInfo, getPlaylistByID } = require('./modules/music')
const { checkIfTokenIsExpired, getAccessToken } = require('./modules/token')
const { getUserInfo, getCurrentUserPlaylists, getCurrentUserTopArtists, 
        getCurrentUserTopTracks, setCurrentUserPlaylist, fillCurrentUserPlaylist, 
        getUserLastDiscussion, getUserDiscussions, getUserDiscussionMessages, 
        setUserLastDiscussion, getUser, getTArtist, 
        getTTrack } = require('./modules/user')

const express = require('express')
const cors = require ('cors')
const cookieParser = require('cookie-parser')
const { encryptCookieNodeMiddleware, decryptCookieSocketMiddleware } = require('encrypt-cookie')
const { URLSearchParams } = require('url')
const { time } = require('console')

require('dotenv').config()

const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
        method: ['GET', 'POST']
    }
})

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    method: ['GET', 'POST']
}))
app.use(express.json())
app.use(cookieParser(process.env.SIGNATURE_SECRET))
app.use(encryptCookieNodeMiddleware(process.env.ENCRYPTION_SECRET))

app.get('/', (req, res) => {
    res.redirect('http://localhost:3000/')
})

app.get('/login', (req, res) => {
    const userID = req.signedCookies ? req.signedCookies['userID'] : null
    
    if (userID) {
        res.redirect('http://localhost:3000/')
        return
    }

    const randomNumber = Math.random().toString()
    const state = randomNumber.substring(2, randomNumber.length)

    res.cookie('state', state, {signed: true})

    const params = new URLSearchParams()

    params.set('client_id', process.env.CLIENT_ID)
    params.set('response_type', 'code')
    params.set('redirect_uri', encodeURI(process.env.REDIRECT_URI))
    params.set('state', state)
    params.set('scope', process.env.SCOPE)
    
    res.redirect('https://accounts.spotify.com/authorize?' + params)
})

app.get('/callback', async (req, res) => {
    const userID = req.signedCookies ? req.signedCookies['userID'] : null

    if (userID) {
        res.redirect('http://localhost:3000/')
        return
    }

    const code = req.query.code
    const state = req.query.state
    const error = req.query.error
    const storedState = req.signedCookies ? req.signedCookies.state : null
    
    if (!error || state === storedState) {
        res.clearCookie('state')

        const resToken = await getAccessToken(code)

        if ('res' in resToken) {
            const resUser = await getUserInfo(resToken.res.access_token)
            const rangeTerm = ["short_term", "medium_term", "long_term"]
            const resTopA = []
            const resTopT = []
            for(i=0; i<rangeTerm.length; i++) {
                resTopA.push( await getCurrentUserTopArtists(resToken.res.access_token, rangeTerm[i]) )
                resTopT.push(await getCurrentUserTopTracks(resToken.res.access_token, rangeTerm[i]))
            }
            

            if ('res' in resUser)
                await insertUserInDatabase(res, resUser.res, resToken.res, resTopA, resTopT)
        }
    }
    res.redirect('http://localhost:3000/')
})

app.get('/me', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return
    
    const access_token = req.signedCookies.access_token
    const response = await getUserInfo(access_token)
    
    res.json(response)
})

app.get('/me/playlists', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return

    const access_token = req.signedCookies.access_token
    const response = await getCurrentUserPlaylists(access_token)
    
    res.json(response)
})

app.post('/me/top/artists', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return

    if ('time_range' in req.body){
        const access_token = req.signedCookies.access_token
        const time_range = req.body.time_range
        const response = await getCurrentUserTopArtists(access_token, time_range)
        
        res.json(response)
    }else {
        res.json({
            error: 'error'
        })
    }
    
})

app.post('/me/top/tracks', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return

        if ('time_range' in req.body){
            const access_token = req.signedCookies.access_token
            const time_range = req.body.time_range
            const response = await getCurrentUserTopTracks(access_token, time_range)
            
            res.json(response)
        }else {
            res.json({
                error: 'error'
            })
        }
})

app.post('/users/me/playlists', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return
    
    if (req.signedCookies['userID'] && 'playlistName' in req.body && 'playlistDesc' in req.body) {
        const userID = req.signedCookies.userID
        const access_token = req.signedCookies.access_token
        const playlistName = req.body.playlistName
        const playlistDesc = req.body.playlistDesc
        const response = await setCurrentUserPlaylist(userID, access_token, playlistName, playlistDesc)

        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/playlists/playlistID/tracks', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return
    
    if ('playlistID' in req.body && 'tracksUris' in req.body) {
        const access_token = req.signedCookies.access_token
        const playlistID = req.body.playlistID
        const tracksUris = req.body.tracksUris
        const response = await fillCurrentUserPlaylist(access_token, playlistID, tracksUris)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/artists/artistID/top-tracks', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return
    
    if ('artistID' in req.body) {
        const access_token = req.signedCookies.access_token
        const artistID = req.body.artistID
        const response = await getArtistTopTracks(access_token, artistID)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/audio-features/trackID', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return
    
    if ('trackID' in req.body) {
        const access_token = req.signedCookies.access_token
        const trackID = req.body.trackID
        const response = await getTracksInfo(access_token, trackID)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/playlists/playlistID', async (req, res) => {
    const exit = await checkIfTokenIsExpired(req, res)
    if (exit)
        return
    
    if ('playlistID' in req.body) {
        const access_token = req.signedCookies.access_token
        const playlistID = req.body.playlistID
        const response = await getPlaylistByID(access_token, playlistID)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.get('/bd/user', async(req, res) => {
    if('userID' in req.query) {
        const response = await getUser(req.query.userID)
        res.json(response)
    } else 
        res.json({ error : 'Error man'})
})

app.get('/bd/top/artist', async (req, res) => {
    console.log(req.query)
    if ('userID' in req.query){
        const userID = req.query.userID
        if ('time_range' in req.query) {
             time_range = req.query.time_range
        } else {
             time_range = 'short_term'
        }

        const response = await getTArtist(userID, time_range)
        res.json(response)
    } else {
        res.json({ error: 'caca'})
    } 
        
})

app.get('/bd/top/track', async (req, res) => {
    console.log(req.query)
    if ('userID' in req.query){
        const userID = req.query.userID
        if ('time_range' in req.query) {
             time_range = req.query.time_range
        } else {
             time_range = 'short_term'
        }

        const response = await getTTrack(userID, time_range)
        res.json(response)
    } else {
        res.json({ error: 'caca'})
    } 
        
})

app.get('/lastDiscussion', async (req, res) => {
    const userID = req.signedCookies ? req.signedCookies.userID : null

    if (userID) {
        const response = await getUserLastDiscussion(userID)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.get('/discussions', async (req, res) => {
    const userID = req.signedCookies ? req.signedCookies.userID : null

    if (userID) {
        const response = await getUserDiscussions(userID)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/messages', async (req, res) => {
    if ('discussionID' in req.body) {
        const discussionID = req.body.discussionID

        const response = await getUserDiscussionMessages(discussionID)
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/usersStatus', async (req, res) => {
    if ('discussionID' in req.body) {
        const discussionID = req.body.discussionID

        const discussionUsers = await getDiscussionUsers(discussionID)
        const sockets = await io.in(discussionID).fetchSockets()

        //console.log(discussionUsers)
        //console.log(sockets)

        const response = []
        
        res.json(response)
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.post('/lastDiscussion', async (req, res) => {
    const userID = req.signedCookies ? req.signedCookies.userID : null

    if (userID && 'discussionID' in req.body) {
        const playlistID = req.body.discussionID

        await setUserLastDiscussion(userID, playlistID)
        
        res.json({
            res: 'Done'
        })
    } else {
        res.json({
            error: 'Error'
        })
    }
})

app.get('*', (req, res) => {
    res.redirect('http://localhost:3000/')
})

io.use(decryptCookieSocketMiddleware(process.env.SIGNATURE_SECRET, process.env.ENCRYPTION_SECRET))

io.on('connection', async socket => {
    if (socket.handshake.signedCookies && 'userID' in socket.handshake.signedCookies)
        socket.userID = socket.handshake.signedCookies.userID

    socket.on('initDiscussions', async () => {
        const discussions = await getDiscussionsByUserID(socket.userID)

        if (discussions.res.length > 0) {
            for (const discussion of discussions.res) {
                socket.join(discussion.discussionID)
            }
        }
    })

    socket.on('sendMessage', async data => {
        const message = await insertMessageInDiscussion(data.discussionID, socket.userID, data.content)

        message.discussionID = data.discussionID
        message.userID = socket.userID
        message.content = data.content

        io.to(data.discussionID).emit('receiveMessage', message)
    })

    socket.on('addDiscussion', data => {
        socket.join(data.room)
        io.to(data.room).emit('receiveMessage', data.name + ' a rejoint la discussion')
    })

    socket.on('removeDiscussion', data => {
        socket.leave(data.room)
        io.to(data.room).emit('receiveMessage', data.name + ' a quitté la discussion')
    })
})

server.listen(8000, async () => {
    console.log('Listening on port 8000')
    await createDatabaseIfNotExist()
})


/*
const store = new KnexSessionStore({
    knex: knex,
    tablename: 'sessions',
    sidfieldname: 'sid',
    createtable: true,
    clearInterval: 60 * 60 * 1000
})

app.use(session({
    secret: process.env.process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 60 * 60 * 1000
    }
}))
*/