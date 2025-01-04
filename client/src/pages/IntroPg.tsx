import bgtexture from '../assets/bgtexture.jpg'
import {Link} from 'react-router-dom'

function IntroPg() {

    return (
        <section className="flex flex-col items-center p-8 min-h-screen" style={{backgroundImage: `url(${bgtexture})`}}>
            <h1 className="font-headline text-5xl font-bold mb-2">TRUELEDGER</h1>
            <p className="font-primary text-center">Say No to Money Laundering with Blockchain-Secured Transparency in Tasks.</p>
            <div className="flex flex-col md:flex-row items-center justify-evenly mt-4 w-full">
                <div className="w-3/4 md:w-1/4 bg-transparent backdrop-filter backdrop-blur-lg bg-opacity-10 p-4 rounded-lg border-white border-solid border-2 mb-4 md:mb-0">
                    <img src="https://plus.unsplash.com/premium_vector-1725434321937-4b3432d64d36?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="placeholder" className="rounded-md" />
                    <h1 className="font-bold text-lg">Taskholder</h1>
                    <p className="text-xs">(Executes tasks allocated by Regulator)</p>
                    <div className="flex flex-row items-center justify-between">
                        <Link to="/clientpg">
                        <button className="font-primary text-sm font-semibold mt-2 py-1 px-4 rounded-lg border-white border hover:bg-white hover:text-black">Login</button>
                        </Link>
                        <button className="font-primary text-gray-300 text-sm mt-2 py-1 hover:text-white">Not Registered? SignUp</button>
                    </div>
                </div>
                <h1 className="font-primary text-2xl font-bold mb-2 md:absolute md:mx-4">OR</h1>
                <div className="w-3/4 md:w-1/4 bg-transparent backdrop-filter backdrop-blur-lg bg-opacity-10 p-4 rounded-lg border-white border-solid border-2">
                    <img src="https://plus.unsplash.com/premium_vector-1720601640744-a80ffc4ec893?q=80&w=1800&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="placeholder" className="rounded-md" />
                    <h1 className="font-bold text-lg">Regulator</h1>
                    <p className="text-xs">(Allocate Funds given by Government Budget)</p>
                    <div className="flex flex-row items-center justify-between">
                        <Link to="/serverpg">
                         <button className="font-primary text-sm font-semibold mt-2 py-1 px-4 rounded-lg border-white border hover:bg-white hover:text-black">Login</button>
                        </Link>
                        <button className="font-primary text-gray-300 text-sm mt-2 py-1 hover:text-white">Not Registered? SignUp</button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default IntroPg