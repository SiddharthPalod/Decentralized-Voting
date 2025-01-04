import bgtexture from '../assets/bgtexture.jpg';
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import Logo from "../assets/logo.webp";
import MoneyCard from '../utlis/MoneyCard';
import TodoList from '../utlis/TodoList';
import RequestInput from '../utlis/RequestInput';
// import { TaskProvider } from '../utlis/task/TaskContext';
// import { NotificationProvider } from '../utlis/task/NotificationContext';
import NotificationList from '../utlis/NotificationsList';

const aptosConfig = new AptosConfig({ network: Network.DEVNET });
export const aptos = new Aptos(aptosConfig);
export const moduleAddress =
  "0x3c6d41e6d9cb82e798e861606d8ef50f90b6aedb1ef66e97c33f8879013bce6b";

const ClientIntroPg: React.FC = () => {
  const { walletAddress } = useParams();
  // const navigate = useNavigate();
  const { account, signAndSubmitTransaction } = useWallet();

  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [userData, setUserData] = useState<{
    name: string;
    field: string;
  } | null>(null);

  // const goTo = ({ path }: { path: string }) => {
  //   navigate(`/user/${walletAddress}/${path}`);
  // };

  // Fetch user data from the blockchain
  const fetchUserData = async () => {
    if (!account || !walletAddress) return;
    setLoading(true);
    try {
      const resource = await aptos.getAccountResource({
        accountAddress: walletAddress,
        resourceType: `${moduleAddress}::user::User`,
      });
      setUserExists(true);
      setUserData({
        name: resource.data.name,
        field: resource.data.field,
      });
    } catch (error) {
      console.error("User does not exist:", error);
      setUserExists(false);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Create a user profile on the blockchain
  const createUser = async () => {
    if (!account) return;
    setTransactionInProgress(true);
    const transaction: InputTransactionData = {
      data: {
        function: `${moduleAddress}::user::create_user`,
        functionArguments: [],
      },
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction(response.hash);
      console.log("User created successfully.");
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user. Please try again.");
    } finally {
      setTransactionInProgress(false);
      fetchUserData();
    }
  };

  useEffect(() => {
    if (walletAddress && account) {
      fetchUserData();
    }
  }, [walletAddress, account]);

  // Render taskholder details
  const renderUserDetails = () => (
    <div className="flex md:flex-row items w-screen flex-col justify-center gap-10">
      <div className="p-4 mr-10 min-h-96 md:px-8 flex flex-col items-start md:min-w-fit gap-2 mb-2 text-black bg-white shadow-md rounded-lg">
        <h1 className="text-center text-2xl font-bold">Taskholder Details</h1>
        <p><b>Username:</b> {userData?.name || "Loading..."}</p>
        <p><b>Field:</b> {userData?.field || "Loading..."}</p>
        <p><b>Wallet:</b> {walletAddress}</p>
        <p><b>Funds Provided:</b> ₹ 1250000</p>
        <p><b>Tasks Done:</b> 4</p>
        <MoneyCard title="Funds Used" percentage={1.2} amount={15000} />
        <button className="w-full border-blue-500 border-2 p-2 text-white shadow-sm rounded-xl bg-blue-500 font-bold hover:bg-white hover:text-blue-500">
          Request Funds
        </button>
        <RequestInput/>
      </div>
      <div className="mr-10 md:w-1/2">
        <TodoList />
      </div>
    </div>
  );

  // Render create user button
  const renderCreateUser = () => (
    <div className="flex flex-col items-center">
      <p>User not found. Create your profile to continue.</p>
      <button
        onClick={createUser}
        disabled={transactionInProgress}
        className="bg-blue-500 text-white px-6 py-2 rounded mt-4"
      >
        {transactionInProgress ? "Creating..." : "Create User"}
      </button>
    </div>
  );

  return (
        <section
          className="flex flex-col font-primary items-center p-4 min-h-screen"
          style={{ backgroundImage: `url(${bgtexture})` }}
        >
          <div id="navbar" className="flex flex-row justify-between w-screen items-center z-50">
            <Link to="/">
              <img src={Logo} className="h-12 mx-8" alt="Logo" />
            </Link>
            <div className="mx-8 flex-row flex items-center gap-4">
              <WalletSelector />
              <NotificationList />
            </div>
          </div>
          <h1 className="font-headline text-3xl lg:text-5xl font-bold mt-4 md:mb-2">
            Welcome Taskholder
          </h1>
          <p className="text-center mb-8">Execute tasks allocated by Regulator.</p>
          <div className="m-auto flex justify-center items-center gap-10">
            {loading ? (
              <p>Loading taskholder data...</p>
            ) : userExists ? (
              renderUserDetails()
            ) : (
              renderCreateUser()
            )}
          </div>
        </section>
  );
};

export default ClientIntroPg;
