import { useEffect, useState } from 'react';
import { getFollowedUsers } from '../scripts/database';
import { catchErrors } from '../utils';
import { StyledButton, StyledLogoutButton } from '../styles';
import { SectionWrapper, UserGrid } from '../components';

const Followed = () => {
    const [followedUsers, setFollowedUsers] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const followed = await getFollowedUsers()
            console.log(followed)
            setFollowedUsers(followed)
        }

        catchErrors(fetchData());
    }, [])

    return (
        <>
            <StyledButton href="/me">Home</StyledButton>
            <StyledLogoutButton href='http://localhost:8000/logout'>Se déconnecter</StyledLogoutButton>
            <main>
                <SectionWrapper title ="Followed">
                    {
                        followedUsers && (
<UserGrid users={followedUsers.userFollowed}/>
                        )
                    }
                    
                </SectionWrapper>
            </main>

        </>

    )

}
export default Followed;