// email validation
export const isValidEmail = (email) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

// validates that a string contains only letters, spaces, and hyphens
export const isValidName = (name) => {
	const nameRegex = /^[a-zA-Z\s\-']*$/;
	return nameRegex.test(name);
};

// validates password strength (at least 6 characters)
export const isValidPassword = (password) => {
	return password.length >= 6;
};

// get error message for field
export const getFieldError = (field, value) => {
	if (!value || value.trim() === '') {
		switch (field) {
			case 'name':
				return 'Full name is required';
			case 'email':
				return 'Email is required';
			case 'password':
				return 'Password is required';
			default:
				return 'This field is required';
		}
	}

	if (field === 'email') {
		if (!isValidEmail(value)) {
			return 'Invalid email address';
		}
	}

	if (field === 'name') {
		if (!isValidName(value)) {
			return 'Name can only contain letters, spaces, hyphens, and apostrophes';
		}
	}

	if (field === 'password') {
		if (!isValidPassword(value)) {
			return 'Password must be at least 6 characters';
		}
	}

	return null;
};

// validate all form fields
export const validateForm = (fields) => {
	const errors = {};
	Object.entries(fields).forEach(([key, value]) => {
		const error = getFieldError(key, value);
		if (error) {
			errors[key] = error;
		}
	});
	return errors;
};
