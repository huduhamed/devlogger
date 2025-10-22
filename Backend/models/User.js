import mongoose from 'mongoose';

// define user schema
const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'name is required'],
			trim: true,
			minLength: 2,
			maxLength: 50,
		},
		email: {
			type: String,
			required: [true, ' email is required'],
			unique: true,
			lowercase: true,
			match: [/\S+@\S+\.\S+/, 'enter a valid email'],
		},
		password: {
			type: String,
			required: [true, 'password is required'],
			minLength: 4,
		},
		passwordChangedAt: {
			type: Date,
			default: null,
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user',
		},
		organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
		avatarUrl: {
			type: String,
			default: '',
		},
	},
	{ timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
