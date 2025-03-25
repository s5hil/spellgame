import { useState } from 'react'
import Menu from './Menu.jsx'
import Game from './Game.jsx'
import './style.css'

function App() {
	const [gameStarted, setGameStarted] = useState(true) // change to false if i want to start the game from the menu

	return (
		<div>
			{gameStarted ? <Game setGameStarted={setGameStarted} /> : <Menu setGameStarted={setGameStarted} />}
		</div>
	)
}

export default App