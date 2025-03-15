/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

const express = require('express');
const mongoose = require('mongoose');
const marked = require('marked'); 

//Text are wiki like objects.  They have a Markdown source document and the rendered html.
//There is also a slug so that they can link to each other
const textSchema = new mongoose.Schema({
	source: String, //Markdown text
	slug: String, //a short label that can be used in a link or URL
	html: String, //the source rendered as an HTML fragment
	i18n: { // keys are ISO 639 language codes
		type: Map,
		of: {
			source: String,
			html: String
		}
	},
    
	methods: {
		getHtml: function(languageCode) {
			let content = this;
			if (languageCode && this.i18n.has(languageCode)) {
				content = this.i18n.get(languageCode);
			}
			if (!content.html) {
				// Render the markdown to HTML
				content.html = marked(content.source);
			}
			return content.html;
		}
	}
	
})

textSchema.index({slug: 1})

const Text = mongoose.model('Text', textSchema)

// A schema for holding types of goods
const commoditySchema = new mongoose.Schema({
	name: {type:String, required: true},
	minLevel: Number, // lowest level produced default is 1
	maxLevel: Number, // if present the highest level
	storage: {type: String, enum: ['Standard', 'Bulk', 'Fluid', 'Hazardous']},
	description: { type: mongoose.ObjectId, ref: 'Text'} //A description of the commodity
})

commoditySchema.index({name: 1})

const Commodity = mongoose.model('Commodity', commoditySchema)

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

// App
const app = express();

// Set Pug as the template engine
app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', (req, res) => {
	res.send('Hello remote world!\n');
});

app.get('/text/:slug', async (req, res) => {
	try {
		const text = await Text.findOne({slug: req.params.slug});
		if (!text) {
			return res.status(404).send('Not Found');
		}
		res.render('text', { title: text.slug, content: text.getHtml() });
	} catch (error) {
		res.status(500).send('Error retrieving text');
	}
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);