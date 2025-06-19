import type { JSX } from "ovr";

// WIP

export const Dialog = (props: {
	children?: JSX.Element;
	title: string;
	trigger: JSX.IntrinsicElements["button"];
}) => {
	const { title, children, trigger } = props;

	return (
		<drab-dialog click-outside-close>
			<button data-trigger type="button" {...trigger} />

			<dialog
				data-content
				class="bg-background backdrop:bg-muted/75 my-0 mr-auto ml-0 h-full max-h-screen w-full max-w-screen border-r p-6 backdrop:backdrop-blur sm:max-w-96"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2 class="my-0">{title}</h2>
					<button
						data-trigger
						class="ghost icon"
						aria-label="Close"
						type="button"
					>
						<span class="icon-[lucide--x]"></span>
					</button>
				</div>
				<div>{children}</div>
			</dialog>
		</drab-dialog>
	);
};
