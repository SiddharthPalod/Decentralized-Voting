import bgtexture from '../assets/bgtexture.jpg'
import RequestInput from '../utlis/RequestInput';
import { Link } from "react-router-dom";
import Logo from "../assets/logo.webp";

const ServerIntroPg: React.FC = () => {

    return (
        <section className="flex flex-col font-primary items-center p-8 min-h-screen" style={{backgroundImage: `url(${bgtexture})`}}>
        <div id='navbar' className="flex flex-row justify-between w-screen items-center z-50">
            <Link to="/">
                <img src={Logo} className="h-12 mx-8" />
            </Link>
        </div>
            
            <h1 className="font-headline text-5xl font-bold mb-2">Server Intro page</h1>
            <p className="text-center">Say No to Money Laundering with Blockchain-Secured Transparency in Tasks.</p>
            <RequestInput/>
        </section>
    )
}

export default ServerIntroPg