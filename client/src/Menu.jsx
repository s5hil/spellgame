function Menu({setDifficulty, setGameStarted}) {
	const startGame = () => {
		setGameStarted(true)
	}
	
	return (
		<div>
			<h1>Spell Game</h1>
			<input type="radio" name="difficulty" value="easy" onChange={(e) => setDifficulty(e.target.value)} /> Easy
			<input type="radio" name="difficulty" value="medium" onChange={(e) => setDifficulty(e.target.value)} defaultChecked /> Medium
			<input type="radio" name="difficulty" value="hard" onChange={(e) => setDifficulty(e.target.value)} /> Hard

			<button onClick={startGame}>Start</button>
		</div>
	)
}

export default Menu