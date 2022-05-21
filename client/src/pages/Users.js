import { useEffect, useState } from 'react';
import { getOtherUsers } from '../scripts/database';
import { catchErrors } from '../utils';
import { StyledButton, StyledLogoutButton } from '../styles';
import { SectionWrapper, UserGrid } from '../components';

const Users = () => {
    const [otherUsers, setOtherUSers] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const others = await getOtherUsers()
            setOtherUSers(others)
            console.log(others)
        }

        catchErrors(fetchData());
    }, [])

    return (
        <>
            <StyledButton href="/me">Home</StyledButton>
            <StyledLogoutButton href='http://localhost:8000/logout'>Se déconnecter</StyledLogoutButton>
            <main>
                <SectionWrapper title ="Utilisateurs">
                    <UserGrid users={otherUsers}/>
                </SectionWrapper>
            </main>

        </>

    )

}
export default Users;