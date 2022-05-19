import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:8000'
axios.defaults.withCredentials = true

export const getUserTArtist = async (userID, time_range) => {
    const response = await axios.get('/bd/top/artist', {
        params : {
            userID: userID,
            time_range: time_range
        }
    })
    return response.data
}

export const getUserTTrack = async (userID, time_range) => {
    const response = await axios.get('bd/top/track', {
        params: {
            userID: userID,
            time_range: time_range
        }
    })
    return response.data
}

export const getUser = async (userID) => {
    const response = await axios.get('bd/user', {
        params: {
            userID: userID
        }
    })
    return response.data
}