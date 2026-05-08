/**
 * SEO utilities for dynamic page titles, meta descriptions and structured data
 */

export const setPageMeta = (title, description, canonicalUrl = 'https://devlogger.io') => {
	// Update title
	if (title) {
		document.title = `${title} - Devlogger`;
	}

	// Update meta description
	if (description) {
		let metaDescription = document.querySelector('meta[name="description"]');
		if (!metaDescription) {
			metaDescription = document.createElement('meta');
			metaDescription.name = 'description';
			document.head.appendChild(metaDescription);
		}
		metaDescription.content = description;
	}

	// Update canonical URL
	if (canonicalUrl) {
		let link = document.querySelector('link[rel="canonical"]');
		if (!link) {
			link = document.createElement('link');
			link.rel = 'canonical';
			document.head.appendChild(link);
		}
		link.href = canonicalUrl;
	}
};

export const addStructuredData = (data) => {
	const script = document.createElement('script');
	script.type = 'application/ld+json';
	script.textContent = JSON.stringify(data);
	document.head.appendChild(script);
};

// Organization structured data (JSON-LD)
export const getOrganizationSchema = () => ({
	'@context': 'https://schema.org',
	'@type': 'SoftwareApplication',
	name: 'Devlogger',
	description: "Your team's logging headquarters for tracking, sharing, and learning from events",
	url: 'https://devlogger.io',
	image: 'https://devlogger.io/og-image.png',
	applicationCategory: 'BusinessApplication',
	offers: {
		'@type': 'Offer',
		priceCurrency: 'USD',
		price: 'free',
		priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
			.toISOString()
			.split('T')[0],
	},
	creator: {
		'@type': 'Organization',
		name: 'Devlogger Inc',
		url: 'https://devlogger.io',
	},
});

// Breadcrumb structured data
export const getBreadcrumbSchema = (breadcrumbs) => ({
	'@context': 'https://schema.org',
	'@type': 'BreadcrumbList',
	itemListElement: breadcrumbs.map((item, index) => ({
		'@type': 'ListItem',
		position: index + 1,
		name: item.name,
		item: item.url,
	})),
});

// FAQPage structured data
export const getFAQSchema = (faqs) => ({
	'@context': 'https://schema.org',
	'@type': 'FAQPage',
	mainEntity: faqs.map((faq) => ({
		'@type': 'Question',
		name: faq.question,
		acceptedAnswer: {
			'@type': 'Answer',
			text: faq.answer,
		},
	})),
});
