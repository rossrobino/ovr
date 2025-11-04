import "drab/prefetch/define";
import "drab/share/define";

if (import.meta.env.DEV) {
	const ovr = await import("ovr");

	async function Async() {
		return <p>Async</p>;
	}

	function* Component() {
		for (let i = 0; i < 500; i++) {
			yield (
				<div>
					{i}
					<Async />
				</div>
			);
		}
	}

	const gen = ovr.toGenerator(<Component />);

	const time = performance.now();
	for await (const _chunk of gen) {
		// ...
	}
	console.log(performance.now() - time);
}
