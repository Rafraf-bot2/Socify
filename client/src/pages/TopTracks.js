import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCurrentUserTopTracks, getCurrentUserProfile } from '../scripts/user';
import {getUser, getUserTTrack} from '../scripts/database';
import { TrackList, SectionWrapper, RangeButton } from '../components';
import { PlaylistGenButton } from '../components';
import { catchErrors } from '../utils';
import { StyledButton, StyledLogoutButton } from '../styles';

const TopTracks = () => {
    const {userID} = useParams();
    const [topTracks, setTopTracks] = useState(null);
    const [activeRange, setActiveRange] = useState('short');
    const [profile, setProfile] = useState(null);

    const [user, setUser] = useState(null)
    const [tTrack, setTTrack] = useState(null);

    useEffect (() => {
            /**
         * On crée une fct asynchrone pour ne pas rendre le hook useEffect asynchrone (sinon c'est le dawa)
         * https://github.com/facebook/react/issues/14326
         */
        const fetchData = async () => {
            const tracks = await getCurrentUserTopTracks(`${activeRange}_term`);
            setTopTracks(tracks);

            const userProfile = await getCurrentUserProfile();
            setProfile(userProfile);
            
            const userInf = await getUser(userID)
            setUser(userInf)
            console.log(userID)

            const userTTrack = await getUserTTrack(userID, `${activeRange}_term`)
            setTTrack(userTTrack)
        };
        catchErrors(fetchData());
    },[activeRange, userID]);

    let j = 0
    if(tTrack) {
        console.log(tTrack)
        for(j=0; j < tTrack.length ; j++) {
            if(!(tTrack[j])[0])
                break;
        }
        console.log(j)
    }
    
    return(
        <>
            <StyledButton href="/me">Home</StyledButton>
            <StyledLogoutButton href='http://localhost:8000/logout'>Se déconnecter</StyledLogoutButton>
            <main>
                <SectionWrapper title='🚀 Top Sons' breadcrumb={true}>
                    <RangeButton activeRange={activeRange} setActiveRange={setActiveRange}/>
                    {tTrack && (<TrackList tracks={tTrack.slice(0, j)}/>)}
                </SectionWrapper>
                {tTrack && (
                <PlaylistGenButton items={tTrack.slice(0, j)} type={'tracks'} profile={user} range={activeRange}/>)}
            </main>
        </>
    )
};

export default TopTracks;