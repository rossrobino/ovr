export const Head = (props: { title: string; description: string }) => {
	return (
		<>
			<title>{props.title}</title>
			<meta name="description" content={props.description} />
		</>
	);
};
