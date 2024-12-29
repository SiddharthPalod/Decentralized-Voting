# Decentralized-Voting

1) AWS for cloud storage of votes
2) Ensure concurrency (for users) and live updates (for admin)
3) Create smart contract for my very own blockchain currency and each user is given 1 token of the currency to vote
4) This smart contract is blockchain obviously and users will have a simple transaction based voting system
5) Options to retract the votes and refund currency needs to be added
6) GUI will be made via React Native or Flutter to allow app support if possible via the api
7) GUI will be made using React if app support not possible and deployed on a website via Vercel
8) Use the immutability and transparency and verification of eligibility which can be done via checking govt id like aadhaar card, passport, pan card etc..

FLOW FOR USER:
1) Verify Identity
   - Upload image of govt document (with DOB and nationality)
   - Create a model to extract details like Govt ID Number, DOB and Nationality from image
   - Verify if age is >=18 and nationality is India
   - DO NOT STORE THE IMAGE IN DATABASE to ensure privacy
2) Ask User to connect to blockchain mainnet via MetaMask (or any other tool implement later)
3) Add 1 token of the smart contract test currency onto the main net of MetaMask for the user
4) Let user vote from 4-5 parties
5) Store the vote along with meta mask id and govt id no onto the AWS server
6) Display message indicating voted successfully


FLOW FOR ADMIN:
Enter a UTH-18 encoded password string to login
1) Check the results of votes via Data Visualizations
2) Show Dashboard with live tracking of current lead
3) Show votes by demographics like male/female
4) Show votes by states (if possible)

## Project Flow

![Project Flow](flow.jpg)
