import React from 'react';
import styles from './styles.module.css';

const BotResponse = ({ response }) => {
	// Handle null or undefined response
	if (!response) {
		return <div className={styles.botResponse}>No response available</div>;
	}

	// Handle object responses
	if (typeof response === 'object') {
		if (response.$$typeof === Symbol.for('react.element')) {
			response = response.props.response;
		} else if (response.text) {
			response = response.text;
		} else {
			return <div className={styles.botResponse}>Invalid response format</div>;
		}
	}

	// Ensure response is a string
	const responseString = String(response);

	try {
		const formattedResponse = responseString.split('\n')
			.map((line, index) => {
				if (line.startsWith('**') && line.endsWith('**')) {
					const boldText = line.slice(2, -2);
					return <strong key={index}>{boldText}</strong>;
				}
				// Handle bullet points
				else if (line.startsWith('*')) {
					const content = line.slice(1).trim();
					const [bulletText, regularText] = content.split(':');
					return (
						<li key={index}>
							<strong>{bulletText}</strong>: {regularText}
						</li>
					);
				}
				return <p key={index}>{line}</p>;
			});

		return (
			<div className={styles.botResponse}>
				{formattedResponse}
			</div>
		);
	} catch (error) {
		console.error('Error formatting response:', error);
		return <div className={styles.botResponse}>Error displaying response</div>;
	}
};

export default BotResponse;
