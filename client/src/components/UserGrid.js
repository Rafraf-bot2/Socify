/**
 * Component qui se charge du rendu des artistes
 */
 import {StyledGrid} from '../styles';
 import socifyDefault from '../images/socifyDefault.png'

 const UserGrid = ({users}) => (
     <>
         {users && users.length ? (
             <>
             <StyledGrid type='artist'>
                 {users.map((user, i) => (
                     <a href={'/user/'+user.userID} target='_blank' key={i}>
                         <li className='grid_item' key={i} >
                            <div className='grid_item_inner'>
                                <div className='grid_item_img'>
                                    <img src={user.picture === "" ? socifyDefault : user.picture} alt={user.name}/>
                                </div>
                                <h3 className='grid_item_name overflow-ellipsis'>{user.name}</h3>
                                <p className='grid_item_label'>Utilisateur</p>
                            </div>
                        </li>
                     </a>
                     
                 ))}
             </StyledGrid>

             </>
         ) : (
             <p className='empty-notice'>Pas d'utilisateurs à afficher 😔</p>
         )}
     </>
 );
 
 export default UserGrid;