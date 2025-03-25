## Overview
This is a web-based spelling bee game where users listen the pronunciation and definition of words, then type the correct spelling into an input field to test their spelling skills.

## Technologies Used
- React
- Vite
- Node.js
- Express.js
- Axios
- Supabase
- ElevenLabs
- Google Gemini

## Installation

1. Clone the repository:
```bash
git clone https://github.com/s5hil/spell.git
cd spell
```

2. Install dependencies:
```bash
# Install and set up client
cd client
npm install

# Install and set up server
cd ../server
npm install
```

3. Environment Setup:
   - Edit the `.env` file in the server directory and configure the required environment variables

### Running the Application

1. Start the backend server:
```bash
cd server
npm start
```

2. In a new terminal, start the frontend development server:
```bash
cd client
npm run dev
```