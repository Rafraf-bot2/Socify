const { getLastDiscussionByUserID, getDiscussionsByUserID, getMessagesByDiscussionID, 
        setLastDiscussionByUserID, getTopArtistsFromDB, 
        getTopTrackFromDB, getUserFromDB  } = require('./database')

const axios = require('axios').default

axios.defaults.baseURL = 'https://api.spotify.com/v1'
axios.defaults.headers['Content-Type'] = 'application/json'

const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true
})


const getUserInfo = async (access_token) => {
    const response = await axios.get('/me', {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })
    .then(resUser => {
        return {
            res: resUser.data
        }
    })
    .catch(err => {
        return {
            error: err
        }
    })

    

    return response
}

const getCurrentUserPlaylists = async (access_token) => {
    const limit = 20

    const response = await axios.get(`/me/playlists?limit=${limit}`, {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })
    .then(resUser => {
        return {
            res: resUser.data
        }
    })
    .catch(err => {
        return {
            error: err
        }
    })
    return response
}

const getCurrentUserTopArtists = async (access_token, time_range) => {
    //const time_range = 'short_term'

    const response = await axios.get(
        `/me/top/artists?time_range=${time_range}`, {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })
    .then(resUser => {
        return {
            res: resUser.data
        }
    })
    .catch(err => {
        return {
            error: err
        }
    })

    return response
}

const getCurrentUserTopTracks = async (access_token, time_range) => {
    //const time_range = 'short_term'
    const response = await axios.get(
        `/me/top/tracks?time_range=${time_range}`, {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })
    .then(resUser => {
        return {
            res: resUser.data
        }
    })
    .catch(err => {
        return {
            error: err
        }
    })

    return response
}

const setCurrentUserPlaylist = async (userID, access_token, playlistName, playlistDesc) => {
    const response = await axios({
        method: "POST",
        url: `/users/${userID}/playlists`,
        headers: {
            Authorization: 'Bearer ' + access_token
        },
        data: JSON.stringify({
            name: playlistName,
            description: playlistDesc
        })
    })
    .then(resUser => {
        return {
            res: resUser.data
        }
    })
    .catch(err => {
        return {
            error: err
        }
    })

    return response
}

const fillCurrentUserPlaylist = async (access_token, playlistID, tracksUris) => {
    const response = await axios({
        method: "POST",
        url: `/playlists/${playlistID}/tracks`,
        headers: {
            Authorization: 'Bearer ' + access_token
        },
        data: JSON.stringify({
            uris: tracksUris
        })
    })
    .then(resUser => {
        return {
            res: resUser.data
        }
    })
    .catch(err => {
        return {
            error: err
        }
    })

    return response
}

const getUserLastDiscussion = async userID => {
    return await getLastDiscussionByUserID(userID)
}

const getUserDiscussions = async userID => {
    return await getDiscussionsByUserID(userID)
}

const getUserDiscussionMessages = async discussionID => {
    return await getMessagesByDiscussionID(discussionID)
}

const setUserLastDiscussion = async (userID, discussionID) => {
    return await setLastDiscussionByUserID(userID, discussionID)
}

const getUser = async(userID) => {
    return await getUserFromDB(userID)
}
const getTArtist = async (userID, time_range) => {
    return await getTopArtistsFromDB(userID, time_range)
   }

const getTTrack = async(userID, time_range) => {
    return await getTopTrackFromDB(userID, time_range)
}

module.exports = { getUserInfo, getCurrentUserPlaylists, getCurrentUserTopArtists, 
                   getCurrentUserTopTracks, setCurrentUserPlaylist, fillCurrentUserPlaylist, 
                   getUserLastDiscussion, getUserDiscussions, getUserDiscussionMessages, 
                   setUserLastDiscussion, getUser, getTArtist, 
                   getTTrack }