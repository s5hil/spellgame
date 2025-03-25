const express = require('express')
const axios = require('axios')
const cors = require('cors')
const dotenv = require('dotenv')
const { ElevenLabsClient } = require('elevenlabs')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { createClient } = require('@supabase/supabase-js')
const { generateWords } = require('./GenerateWord')

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY)

const elevenlabs = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY,
})

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const gemini = genAi.getGenerativeModel({model: 'gemini-1.5-flash'})

const app = express()

const corsOptions = {
	origin: 'http://localhost:5173',
}

app.use(cors(corsOptions))

const streamToBuffer = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
};

const aiDefinition = async (word) => {
	const response = await gemini.generateContent([
		`give a dictionary definition along with the word class of the word <${word}> written in the following format: \n\n<word>. A <word class> meaning <definition>`
	])

	return response.response.text()
}

/* const updateWordsOfDayInSupabase = async (data) => {
    const { error } = await supabase
        .from('WordsOfDay')
        .upsert(data, { onConflict: 'id' });

    if (error) {
        console.error('Error updating WordsOfDay in Supabase:', error);
    } else {
        console.log('WordsOfDay updated successfully in Supabase');
    }
}
 */
const generateAudio = async (word, text) => {
    const audioStream = await elevenlabs.generate({
        voice: "Jessica",
        text: text,
        model_id: "eleven_multilingual_v2",
    });

    const audioBuffer = await streamToBuffer(audioStream);

    const { error: uploadError } = await supabase.storage
        .from('audio definitions')
        .upload(`${word}.mp3`, audioBuffer, {
            contentType: 'audio/mpeg',
            upsert: true
        });

    if (uploadError) {
        console.error('Error uploading audio to Supabase:', uploadError);
    }
}

const audioExistsInSupabase = async (word) => {
    const { data: files, error: listError } = await supabase.storage
    .from('audio definitions')
    .list('', { search: `${word}.mp3` });

    return files && files.length > 0;
}

const getAudioFromSupabase = (word) => {
    const { data: audioData, error: audioError } = supabase.storage
        .from('audio definitions')
        .getPublicUrl(`${word}.mp3`);

    return audioData;
}

const getWordsOfDayFromSupabase = async () => {
	const { data, error } = await supabase
		.from('WordsOfDay')
		.select('*')
		.eq('id', 1)
		.single();

	if (error) {
		return null;
	}

    return data;
};

const newWords = async () => {
    await supabase.storage.emptyBucket('audio definitions')

    const categories = {
        easy: [],
        medium: [],
        hard: []
    }

    for (const [category, array] of Object.entries(categories)) {
        const generatedWords = generateWords(category);
        for (const word of generatedWords) {
            array.push(word);
            const definition = await aiDefinition(word);
            await generateAudio(word, definition);
        }
    }

    const newData = {
        id: 1,
        day: new Date().getUTCDate(),
        easy: categories.easy,
        medium: categories.medium,
        hard: categories.hard
    }

    const { error } = await supabase
        .from('WordsOfDay')
        .upsert(newData, { onConflict: 'id' });

    if (error) {
        console.error('Error updating WordsOfDay in Supabase:', error);
    } else {
        console.log('WordsOfDay updated successfully in Supabase');
    }

    return newData;
};

app.get('/api/wordsOfDay', async (req, res) => {
    const today = new Date().getUTCDate();
    let wordsOfDay = await getWordsOfDayFromSupabase();

    if (wordsOfDay && wordsOfDay.day === today) {
        console.log('Words of day already exists in Supabase');
        res.json(wordsOfDay);
    } else {
        const newWordsData = await newWords();
        console.log('Words of day created in Supabase');
        res.json(newWordsData);
    }
});

app.get('/api/geminidefinition/:word', async (req, res) => {
	const word = req.params.word.toLowerCase()
	const definition = await aiDefinition(word)
	res.json(definition)
})

app.get('/api/definition/:word', async (req, res) => {
	const word = req.params.word.toLowerCase()
	const url = `https://od-api.oxforddictionaries.com/api/v2/entries/en-us/${word}`

	try {
		const response = await axios.get(url, {
			headers: {
				'app_id': process.env.OXFORD_APP_ID,
				'app_key': process.env.OXFORD_APP_KEY
			}
		})
		res.json(response.data)
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch definition' })
	}
})

app.get('/api/audio/:word', async (req, res) => {
	const word = req.params.word;

	try {
        const existingFile = await audioExistsInSupabase(word)
        if (existingFile) {
            const audioData = getAudioFromSupabase(word)
            res.send(audioData.publicUrl);
        } else {
            throw new Error('Audio file not found in Supabase');
        }
	} catch (error) {
		res.status(500).send({ error: error.message });
	}
});

app.listen(3000, () => {
	console.log('Server is running on port 3000')
})