import { useEffect, useState } from 'react';
import { getCurrentUserProfile, getCurrentUserPlaylists} from '../scripts/user';
import {getCurrentUser, getCurrentUserTArtist, getCurrentUserTTrack, getOtherUsers} from '../scripts/database';
import { getTracksAverageStats } from '../scripts/music';
import { StyledHeader, StyledButton, StyledLogoutButton } from '../styles';
import { SectionWrapper, ArtistGrid, TrackList, PlaylistsGrid, StatGrid, UserGrid } from '../components';
import { catchErrors } from '../utils';
import socifyDefault from '../images/socifyDefault.png'

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [playlists, setPlaylists] = useState(null);
    const [stats, setStats] = useState(null);
    const [user, setUser] = useState(null)
    const [tArtist, setTArtist] = useState(null);
    const [tTrack, setTTrack] = useState(null);
    const [otherUsers, setOtherUSers] = useState(null);

    useEffect(() => {
        /**
        * On crée une fct asynchrone pour ne pas rendre le hook useEffect asynchrone (sinon c'est le dawa)
        * https://github.com/facebook/react/issues/14326
        */
        const fetchData = async () => {
            const userProfile = await getCurrentUserProfile();
            setProfile(userProfile);

            const userPlaylists = await getCurrentUserPlaylists();
            setPlaylists(userPlaylists);

            const userInf = await getCurrentUser()
            setUser(userInf)
            console.log(userInf.userID)
            
            const userTArtist = await getCurrentUserTArtist()
            setTArtist(userTArtist)

            const userTTrack = await getCurrentUserTTrack()
            setTTrack(userTTrack)

            const others = await getOtherUsers()
            setOtherUSers(others)
            console.log(others)

            console.log('Ttrack', userTTrack)

            if (userTTrack && userTTrack[0].length > 0) {
                const userStats = await getTracksAverageStats(userTTrack);
                setStats(userStats);
            } else
                setStats(null);
            

        };
        catchErrors(fetchData());
    }, []);

    return (
        <>
            <StyledButton href="/dashboard">Rooms</StyledButton>
            <StyledLogoutButton href="http://localhost:8000/logout">Se déconnecter</StyledLogoutButton>
            {user && (
                <>
                    <StyledHeader type="user">
                        <div className="header_inner">
                            <img className="header_img" src={user.picture === "" ? socifyDefault : user.picture} alt="Avatar"/>
                            
                            <div>
                                <div className="header_overline">Profil</div>
                                <h1 className="header_name">{user.name}</h1>
                                <p className="header_meta">
                                    {playlists && (
                                        <span>
                                            {playlists.total} Playlist{playlists.total > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    <span>
                                        {profile.followers.total} Ami{profile.followers.total > 1 ? 's' : ''}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </StyledHeader>
                    {
                        tArtist && tTrack && otherUsers && (
                            <main>
                                <SectionWrapper title="📊 Stats">
                                    <StatGrid stats={stats}/>
                                </SectionWrapper>
                                <SectionWrapper title="🔥 Artistes du mois" seeAllLink={"/top-artists/"+user.userID}>
                                    <ArtistGrid artists={tArtist.slice(0, 5)}/>
                                </SectionWrapper>

                                <SectionWrapper title="🔥 Sons du mois" seeAllLink={`/top-tracks/${user.userID}`}>
                                    <TrackList tracks={tTrack.slice(0, 5)}/>
                                </SectionWrapper>

                                <SectionWrapper title="Playlists" seeAllLink="/playlists">
                                    <PlaylistsGrid playlists={playlists.items.slice(0,5)}/>
                                </SectionWrapper>
                                <SectionWrapper title="Utilisateurs" seeAllLink="/users">
                                    <UserGrid users={otherUsers.slice(0, 5)}/>
                                </SectionWrapper>
                            </main>
                        )
                    }
                </>
            )}
        </>
    )
};

export default Profile;