import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

function Game() {
	const easyWords = useRef(new Map())
	const mediumWords = useRef(new Map())
	const hardWords = useRef(new Map())

	const [currentSet, setCurrentSet] = useState([])
	const [currentDifficulty, setCurrentDifficulty] = useState("Easy")

	const [currentWord, setCurrentWord] = useState(null)
	const currentAudio = useRef(null)

	const [isPlaying, setIsPlaying] = useState(true)

	const inputRef = useRef()
	const guesses = useRef(new Map())
	const audios = useRef(new Map())

	const generateAudio = async (word) => {
		try {
			const response = await axios.get(`http://localhost:3000/api/audio/${word}`);
			if (response.status !== 200 || !response.data) {
				throw new Error(`Failed to fetch audio for ${word}`);
			}

			const audio = new Audio(response.data);
			audios.current.set(word, audio);

			audio.addEventListener('ended', () => {
				if (audio === currentAudio.current) {
					audio.currentTime = 0;
					audio.play();
				}
			});
		} catch (error) {
			console.error(`Error generating audio for ${word}:`, error);
		}
	};

	const setWordMaps = async (data) => {
		for (const word of data.easy) {
			await generateAudio(word)
			easyWords.current.set(word, 'unanswered')
		}

		for (const word of data.medium) {
			await generateAudio(word)
			mediumWords.current.set(word, 'unanswered')
		}

		for (const word of data.hard) {
			await generateAudio(word)
			hardWords.current.set(word, 'unanswered')
		}
	}

	useEffect(() => {
		axios.get(`http://localhost:3000/api/wordsOfDay`).then(async (response) => {
			const data = response.data
			await setWordMaps(data)

			setCurrentSet(easyWords.current)
			setCurrentDifficulty("Easy")

		}).catch((error) => {
			console.error('Error fetching words of day:', error)
		})
	}, [])

	const onSubmit = (e) => {
		e.preventDefault()
		const inputWord = inputRef.current.value
		if (inputWord === '') return
		
		let isCorrect = inputWord.toLowerCase() === currentWord.toLowerCase()

		guesses.current.set(currentWord, inputWord)
		if (isCorrect) {
			currentSet.set(currentWord, 'correct')
		} else {
			currentSet.set(currentWord, 'incorrect')
		}

		stopAudio()

		let allAnswered = true
		for (const value of currentSet.values()) {
			if (value === 'unanswered') {
				allAnswered = false
				break
			}
		}

		if (allAnswered) {
			switch (currentDifficulty) {
				case "Easy":
					setCurrentSet(mediumWords.current)
					setCurrentDifficulty("Medium")
					break
				case "Medium":
					setCurrentSet(hardWords.current)
					setCurrentDifficulty("Hard")
					break
				case "Hard":
					setIsPlaying(false)
					break
			}
		}

		setCurrentWord(null)
		inputRef.current.value = ''
	}

	const playAudio = (audio) => {
		audio.currentTime = 0;
		audio.play();
		currentAudio.current = audio
	}

	const stopAudio = () => {
		if (currentAudio.current) {
			currentAudio.current.pause();
			currentAudio.current = null;
		}
	}
	
	const onWordClick = (word) => {
		if (currentSet.get(word) === 'unanswered') {
			const newWord = currentWord === word ? null : word
			setCurrentWord(newWord)

			stopAudio()
			if (newWord) {
				playAudio(audios.current.get(newWord))
			}
		}
	}
	
	const restart = () => {
		setIsPlaying(true)
		currentSet.clear()
		guesses.current.clear()
		setCurrentSet(easyWords.current)
		setCurrentDifficulty("Easy")
		setCurrentWord(null)

		for (const key of easyWords.current.keys()) {
			easyWords.current.set(key, 'unanswered')
		}
		for (const key of mediumWords.current.keys()) {
			mediumWords.current.set(key, 'unanswered')
		}
		for (const key of hardWords.current.keys()) {
			hardWords.current.set(key, 'unanswered')
		}
	}
	
	// unanswered, correct, incorrect, selected
	return (
		<div className="container">
			{isPlaying ? (
				<div className="game">
					<div className="wordbuttons">
						{Array.from(currentSet.entries()).map(([key, value]) => (
							<button className={`wordbutton  ${key === currentWord ? 'selected' : ''} ${value === 'correct' ? 'correct' : value === 'incorrect' ? 'incorrect' : 'unanswered'}`} key={key} onClick={() => onWordClick(key)}>play</button>
						))}
					</div>

					<form onSubmit={onSubmit}>
						<input ref={inputRef} />
						<button className="submit" type="submit">Submit</button>
					</form>
				</div>
			) : (
				<div className="end">
					<h2>Results</h2>

					<h1>Easy Words</h1>
					{Array.from(easyWords.current.entries()).map(([key, value]) => (
						<p key={key}>{key} - <span className={`${value} result`}>{guesses.current.get(key)}</span></p>
					))}

					<h1>Medium Words</h1>
					{Array.from(mediumWords.current.entries()).map(([key, value]) => (
						<p key={key}>{key} - <span className={value}>{guesses.current.get(key)}</span></p>
					))}

					<h1>Hard Words</h1>
					{Array.from(hardWords.current.entries()).map(([key, value]) => (
						<p key={key}>{key} - <span className={value}>{guesses.current.get(key)}</span></p>
					))}

					<button className="restart" onClick={restart}>Restart</button>
				</div>
			)}
		</div>
	)
}

export default Game