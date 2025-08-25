import mongoose from 'mongoose';

// define log schema
const logSchema = new mongoose.Schema({
	title: String,
	description: String,
	date: {
		type: Date,
		default: Date.now,
	},
	tags: [String],
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
});

const Log = mongoose.model('Log', logSchema);

// export model
export default Log;
