import * as worldContent from "@/server/demo/wordle/index.md";
import { Head } from "@/ui/head";
import { clsx } from "clsx";
import { Context, Get, Post } from "ovr";

const solution = "CRANE";
const length = 5;
const tries = 6;

export const wordle = new Get("/demo/wordle", (c) => {
	c.head(<Head {...worldContent.frontmatter} />);

	const guesses = getGuesses();
	const solved = guesses.includes(solution);
	const ended = solved || guesses.length === tries;

	return (
		<div class="flex flex-col items-center justify-center gap-6">
			<Board guesses={guesses} />

			{ended && (
				<div>
					{solved ? (
						<span class="text-green-600">You got it in {guesses.length}!</span>
					) : (
						<span class="text-red-600">
							Out of tries! The word was <b>{solution}</b>.
						</span>
					)}
				</div>
			)}

			{!ended && (
				<guess.Form search class="flex gap-2" enctype="multipart/form-data">
					<input type="hidden" name="id" value="id1" />
					<input type="hidden" name="id" value="id2" />
					<input type="file" name="file" />
					<input type="text" name="text=" />
					<input
						type="text"
						maxlength={length}
						name="guess"
						pattern={`[A-Za-z]{${length}}`}
						class={clsx("w-24 text-center font-mono tracking-widest uppercase")}
						placeholder="GUESS"
						aria-label="Enter guess"
					/>
					<button>Guess</button>
				</guess.Form>
			)}
		</div>
	);
});

export const guess = new Post("/demo/guess", async (c) => {
	for await (const part of c.data()) {
		console.log(part);
	}

	return <p>Test</p>;

	// const guesses = getGuesses();
	// const data = await c.req.formData();
	// const guess = z.string().toUpperCase().length(5).parse(data.get("guess"));

	// if (guesses.length < tries) guesses.push(guess);

	// c.redirect(wordle.url({ search: [].map((guess) => ["guess", guess]) }));
});

const getGuesses = () => Context.get().url.searchParams.getAll("guess");

const Board = ({ guesses }: { guesses: string[] }) => {
	return (
		<div class="grid gap-1">
			{Array.from({ length: tries }).map((_, i) => (
				<Row
					word={guesses[i] ?? ""}
					solution={solution}
					isCurrent={!guesses[i] && i === guesses.length}
				/>
			))}
		</div>
	);
};

const feedback = (guess: string, solution: string) => {
	const res: ("g" | "y" | "b")[] = Array(length).fill("b");
	const sol = solution.split("");
	const flag = Array<boolean>(length).fill(false);

	for (let i = 0; i < length; i++) {
		if (guess[i] === sol[i]) {
			res[i] = "g";
			flag[i] = true;
		}
	}

	for (let i = 0; i < length; i++) {
		if (res[i] === "g") continue;

		const foundLetter = sol.findIndex((ch, j) => !flag[j] && ch === guess[i]);
		if (foundLetter !== -1) {
			res[i] = "y";
			flag[foundLetter] = true;
		}
	}

	return res;
};

const Row = ({
	word,
	solution,
	isCurrent,
}: {
	word: string;
	solution: string;
	isCurrent?: boolean;
}) => {
	const cells = Array.from({ length }).map((_, i) => word[i] ?? "");
	const colors =
		word.length === length && !isCurrent ? feedback(word, solution) : [];
	return (
		<div class="flex gap-1">
			{cells.map((ch, i) => (
				<Cell ch={ch} color={colors[i]} isCurrent={isCurrent} />
			))}
		</div>
	);
};

const Cell = ({
	ch,
	color,
	isCurrent,
}: {
	ch: string;
	color?: "g" | "y" | "b";
	isCurrent?: boolean;
}) => {
	return (
		<div
			class={clsx(
				"flex h-12 w-12 items-center justify-center rounded border font-mono text-2xl font-bold shadow-sm select-none",
				color === "g" && "text-base-50 border-green-600 bg-green-500",
				color === "y" && "text-base-950 border-yellow-500 bg-yellow-400",
				color === "b" && "border-base-400 bg-base-300 text-base-950",
				!color && !isCurrent && "border-base-200 bg-background",
			)}
		>
			{ch}
		</div>
	);
};
