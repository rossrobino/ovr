export const Head = (props: { title: string; description: string }) => {
	return (
		<>
			<title>{`${props.title} | ovr`}</title>
			<meta name="description" content={props.description} />
		</>
	);
};
