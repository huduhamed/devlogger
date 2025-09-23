import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
// internal imoports
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import Card, { CardBody, CardHeader } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

// sign-in logic
function SignIn() {
	const [form, setForm] = useState({ email: '', password: '' });
	const navigate = useNavigate();

	const { signin } = useContext(AuthContext);

	// handle chnGE
	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	// handle submit
	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const res = await API.post('/auth/sign-in', form);

			const { token, user } = res.data;
			if (!token || !user) throw new Error('Invalid response from API');

			// save user & token into context & localstaorage
			signin(token, user);

			// redirect user to dashboard
			navigate('/dashboard', { replace: true });
		} catch (error) {
			toast.error('Signin failed: ' + (error.response?.data?.message || error.message));
		}
	};

	return (
		<div className="min-h-[80vh] flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader title="Welcome back" subtitle="Sign in to access your DevLogger dashboard" />
				<CardBody>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Input
							type="email"
							name="email"
							value={form.email}
							onChange={handleChange}
							placeholder="you@example.com"
							label="Email"
							autoComplete="email"
							required
						/>
						<Input
							type="password"
							name="password"
							value={form.password}
							onChange={handleChange}
							placeholder="••••••••"
							label="Password"
							autoComplete="current-password"
							required
						/>
						<Button className="w-full" type="submit" variant="primary">
							Sign In
						</Button>
					</form>
					<div className="text-center text-sm mt-4">
						Don’t have an account?{' '}
						<Link to="/sign-up" className="text-blue-600 hover:underline">
							Sign up
						</Link>
					</div>
				</CardBody>
			</Card>
		</div>
	);
}

export default SignIn;
