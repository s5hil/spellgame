const easyWords = ["apple", "banana", "cherry", "dog", "elephant", "giraffe", "horse", "lion", "monkey", "penguin", "tiger", "zebra"];
const mediumWords = ["avocado", "blueberry", "crocodile", "dolphin", "flamingo", "hippopotamus", "kangaroo", "leopard", "orangutan", "porcupine", "rhinoceros", "walrus"];
const hardWords = ["acquiesce", "bourgeois", "chiaroscuro", "dichotomy", "ephemeral", "facetious", "gregarious", "harbinger", "idiosyncratic", "juxtaposition", "kaleidoscope", "labyrinthine"];

const generateWords = (difficulty) => {
    const source = difficulty === "easy" ? easyWords : difficulty === "medium" ? mediumWords : hardWords;

	const words = [];
	for (let i = 0; i < 3; i++) {
		words.push(source[Math.floor(Math.random() * source.length)]);
	}

	return words;
}

exports.generateWords = generateWords;
