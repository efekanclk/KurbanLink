import { useAuth } from '../auth/AuthContext';
import './Home.css';

const Home = () => {
    const { logout } = useAuth();

    return (
        <div className="home-container">
            <div className="home-content">
                <h1>Welcome to KurbanLink</h1>
                <p>You are successfully authenticated!</p>
                <button onClick={logout}>Logout</button>
            </div>
        </div>
    );
};

export default Home;
