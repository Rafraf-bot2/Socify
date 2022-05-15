const fs = require('fs')
const { parseDate } = require('./common')

require('dotenv').config()

const dbExist = fs.existsSync(process.env.DB_PATH)
const knex = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true
})

const createDatabaseIfNotExist = async () => {
    if (!dbExist) {
        await knex.schema.createTable('Artist', function (table) {
            table.string('artistID').primary().notNullable()
            table.string('name').notNullable()
            table.string('image').notNullable()
        })

        await knex.schema.createTable('Track', function (table) {
            table.string('trackID').primary().notNullable()
            table.string('name').notNullable()
            table.string('image').notNullable()
            table.string('artistName').notNullable()
            table.string('albumName').notNullable()
            table.string('duration').notNullable()

        })

        await knex.schema.createTable('TopArtistList', function (table) {
            table.primary(['listID', 'range'])
            table.string('listID').notNullable()
            table.string('range').notNullable()

            for(i=0; i<20; i++) {
                table.string('artistID' + i)
                table.foreign('artistID' + i).references('Artist.artistID')
            }
            table.foreign('listID').references('Users.userID')
            
        }) 

        await knex.schema.createTable('TopTrackList', function (table) {
            table.primary(['ListID', 'range'])
            table.string('listID').notNullable()
            table.string('range').notNullable()

            for(i=0; i<20; i++) {
                table.string('trackID' + i)
                table.foreign('trackID' + i).references('Track.trackID')
            }

            table.foreign('listID').references('Users.userID')
        })

        await knex.schema.createTable('Users', function (table) {
            table.string('userID').primary().notNullable()
            table.string('name').notNullable()
            table.string('picture').notNullable()
            table.integer('lastDiscussion').notNullable()

        })
        await knex.schema.createTable('Friends', function (table) {
            table.string('userID').notNullable()
            table.string('friendID').notNullable()
            table.primary(['userID', 'friendID'])
            table.foreign('userID').references('Users.userID')
            table.foreign('friendID').references('Users.userID')
        })
        await knex.schema.createTable('Discussions', function (table) {
            table.increments('discussionID').primary()
            table.string('picture').notNullable()
            table.string('name').notNullable()
            table.boolean('type').notNullable()
        })
        await knex.schema.createTable('Messages', function (table) {
            table.increments('messageID').primary()
            table.string('discussionID').notNullable()
            table.string('userID').notNullable()
            table.string('content').notNullable()
            table.string('date').notNullable()
            table.foreign('discussionID').references('Discussions.discussionID')
            table.foreign('userID').references('Users.userID')
        })
        await knex.schema.createTable('Participate', function (table) {
            table.string('userID').notNullable()
            table.integer('discussionID').notNullable()
            //table.integer('scrollPosition').notNullable() To do
            table.foreign('userID').references('Users.userID')
            table.foreign('discussionID').references('Discussions.discussionID')
        })


        await knex('Discussions').insert({picture: 'https://i.scdn.co/image/ab6775700000ee85d0390b295b07f8a52a101767', name: 'Moi', type: false})
        await knex('Discussions').insert({picture: 'https://i.scdn.co/image/ab6775700000ee855067db235dd3330fd32360a4', name: 'Raf', type: true})

        await knex('Messages').insert({userID: '4crvejyosedti4gfzemcx7zmn', discussionID: 1, content: 'Bonjour', date: (new Date()).toString()})
        await knex('Messages').insert({userID: '4crvejyosedti4gfzemcx7zmn', discussionID: 2, content: 'Bonjour', date: (new Date()).toString()})

        await knex('Messages').insert({userID: '31a5ikz4azfj4c56ozwlk7wzq4ti', discussionID: 1, content: 'Bonjour', date: (new Date()).toString()})
        await knex('Messages').insert({userID: '31a5ikz4azfj4c56ozwlk7wzq4ti', discussionID: 2, content: 'Bonjour', date: (new Date()).toString()})

        await knex('Participate').insert({userID: '4crvejyosedti4gfzemcx7zmn', discussionID: 1})
        await knex('Participate').insert({userID: '4crvejyosedti4gfzemcx7zmn', discussionID: 2})

        await knex('Participate').insert({userID: '31a5ikz4azfj4c56ozwlk7wzq4ti', discussionID: 1})
        await knex('Participate').insert({userID: '31a5ikz4azfj4c56ozwlk7wzq4ti', discussionID: 2})
    }
}

const insertUserInDatabase = async (res, userData, tokenData, topArtistT, topTrackT) => {
    const currentTime = new Date()
    const expireTime = new Date(currentTime.getTime() + 55 * 60 * 1000)
    const picture = userData.images.length > 0 ? userData.images[0].url : ''
    const rangeTerm = ['short_term', 'medium_term', 'long_term']

    res.cookie('userID', userData.id, {signed: true})
    res.cookie('access_token', tokenData.access_token, {signed: true})
    res.cookie('refresh_token', tokenData.refresh_token, {signed: true})
    res.cookie('expireTime', expireTime.toString(), {signed: true})

    const rows = await knex('Users').select('*').where('userID', '=', userData.id)
    console.log(topTrackT[0].res.items[0].name)
    if (rows.length !== 1) {
        await knex('Users').insert({userID: userData.id, name: userData.display_name, 
                picture: picture, lastDiscussion: -1})
        for(i = 0; i < rangeTerm.length; i++) {
            await knex('TopArtistList').insert({listID: userData.id, range: rangeTerm[i]}) 
            await knex('TopTrackList').insert({listID: userData.id, range: rangeTerm[i]}) 
        }
        fillTopArtistInDatabase(topArtistT, userData.id); 
        fillTopTrackInDatabase(topTrackT, userData.id)
    
    }
}

const fillTopArtistInDatabase = async (topArtist, listID) => {
    const rangeTerm = ['short_term', 'medium_term', 'long_term']
    
    for(j=0; j< topArtist.length; j++) {
        topArtistElement = topArtist[j].res.items

        if(topArtistElement.length > 1) {
            for(i = 0; i < topArtistElement.length; i++) {
                await knex.raw('UPDATE TopArtistList SET artistID' + i + ' = ? WHERE listID = ? AND range = ?', [topArtistElement[i].id, listID, rangeTerm[j]])
                const artistrow = await knex('Artist').select('*').where('artistID', '=', topArtistElement[i].id)
                if(artistrow.length == 0)
                    await knex('Artist').insert({artistID: topArtistElement[i].id, name: topArtistElement[i].name, image: topArtistElement[i].images[0].url})
            }
        }
    }

    //Log pour voir la bd touche pas mon pote tu va le regretter
    /**
     *      const pipi = await knex('TopArtistList').select('*')
            console.log(pipi)
            const caca = await knex('Artist').select('*')
            console.log(caca)
     */
    
}

const fillTopTrackInDatabase = async (topTrack, listID) => {
    const rangeTerm = ['short_term', 'medium_term', 'long_term']

    for(l = 0; l < topTrack.length; l++) {
        topTrackElement = topTrack[l].res.items
        if(topTrackElement.length > 1) {
            for(k = 0; k < topTrackElement.length; k++) {
                await knex.raw('UPDATE TopTrackList SET trackID' + k + ' = ? WHERE ListID = ? AND range = ?', [topTrackElement[k].id, listID, rangeTerm[l]])
                const trackRow = await knex('Track').select('*').where('trackID', '=', topTrackElement[k].id)
                if(trackRow.length == 0)
                    await knex('Track').insert({trackID: topTrackElement[k].id, name: topTrackElement[k].name, 
                                               image: topTrackElement[k].album.images[2].url, artistName: topTrackElement[k].artists[0].name,
                                               albumName: topTrackElement[k].album.name, duration: topTrackElement[k].duration_ms})
            }
        }
    }
}


const insertMessageInDiscussion = async (discussionID, userID, content) => {
    let message = {date: (new Date()).toString()}
    const user = await knex.select('name', 'picture').from('Users').where('userID', '=', userID)

    await knex.raw('INSERT INTO Messages (discussionID, userID, content, date) VALUES (?, ?, ?, ?)', [discussionID, userID, content, message.date])

    message.date = parseDate(message.date)
    message.name = user[0].name
    message.picture = user[0].picture

    return message
}

const getLastDiscussionByUserID = async userID => {
    let lastDiscussion = -1;
    const rows = await knex.select('lastDiscussion').from('Users').where('userID', '=', userID)

    if (rows.length === 1)
        lastDiscussion = rows[0].lastDiscussion
    
    return {
        res: lastDiscussion
    }
}

const getDiscussionsByUserID = async userID => {
    let friends = [];
    let discussions = [];
    const participants = await knex.select('discussionID').from('Participate').where('userID', '=', userID)

    if (participants.length !== 1) {
        for (const participant of participants) {
            const discussion = await knex.select('*').from('Discussions').where('discussionID', '=', participant.discussionID)
            if (discussion[0].type)
                discussions.push(discussion[0])
            else
                friends.unshift(discussion[0])
        }
    }

    return {
        res: friends.concat(discussions)
    }
}

const getMessagesByDiscussionID = async discussionID => {
    let messages = await knex.select('*').from('Messages').where('discussionID', '=', discussionID)
    
    if (messages.length > 0) {
        for (const message of messages) {
            const user = await knex.select('name', 'picture').from('Users').where('userID', '=', message.userID)
            message.date = parseDate(message.date)
            message.name = user[0].name
            message.picture = user[0].picture
        }
    }

    return {
        res: messages
    }
}

const getDiscussionUsers = async discussionID => {
    let response = []
    const participants = await knex.select('userID').from('Participate').where('discussionID', '=', discussionID)

    if (participants.length > 0) {
        for (const participant of participants) {
            const user = await knex.select('name', 'picture').from('Users').where('userID', '=', participant.userID)
            console.log(user)
            response.push(user)
        }
    }

    return response
}

const setLastDiscussionByUserID = async (userID, lastDiscussion) => {
    await knex.raw('UPDATE Users SET lastDiscussion = ? WHERE userID = ?', [lastDiscussion, userID])
}

module.exports = { createDatabaseIfNotExist, insertUserInDatabase, insertMessageInDiscussion, getLastDiscussionByUserID, getDiscussionsByUserID, getMessagesByDiscussionID, getDiscussionUsers, setLastDiscussionByUserID }