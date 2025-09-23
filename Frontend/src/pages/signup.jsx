import { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

//internal imports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

function SignUp() {
	const [form, setForm] = useState({ name: '', email: '', password: '' });
	const { signin, auth } = useContext(AuthContext);
	const navigate = useNavigate();

	// redirect if already logged in
	useEffect(() => {
		if (auth?.token) {
			navigate('/dashboard', { replace: true });
		}
	}, [auth, navigate]);

	// handle form change
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const res = await API.post('/auth/sign-up', form);
			const { token, user } = res.data;

			if (!token || !user) throw new Error('Invalid response from API');
			signin(token, user);

			navigate('/dashboard', { replace: true });
		} catch (err) {
			toast.error('Signup failed: ' + (err.response?.data?.message || err.message));
		}
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader title="Create your account" subtitle="Start logging and monitoring events" />
				<CardBody>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Input name="name" onChange={handleChange} placeholder="Jane Doe" label="Full name" required />
						<Input name="email" type="email" onChange={handleChange} placeholder="you@example.com" label="Email" required />
						<Input name="password" type="password" onChange={handleChange} placeholder="••••••••" label="Password" required />
						<Button type="submit" className="w-full">Sign Up</Button>
					</form>
					<div className="text-center text-sm mt-4">
						Already have an account?{' '}
						<Link to="/sign-in" className="text-blue-600 hover:underline">
							Sign In
						</Link>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

export default SignUp;
