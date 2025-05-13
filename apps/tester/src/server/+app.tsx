import { CreateUser, CreateUserForm } from "./create-user";
import { html } from "client:page";
import { App, Suspense } from "ovr";

async function* Delay(props: { ms: number }) {
	await new Promise((res) => setTimeout(res, props.ms));
	yield <p>{props.ms}</p>;
}

const app = new App({
	start(c) {
		c.base = html;
	},
});

app.form(CreateUserForm);

app.get("/create-user", (c) => c.page(<CreateUser />));

app.get("/", (c) =>
	c.page(
		<main class="prose">
			<h1>tester</h1>

			<a href="/create-user">Create user</a>

			<Suspense
				fallback={<p>Loading...</p>}
				after={
					<>
						<h2>After</h2>
						<h2>After 2</h2>
						<Suspense fallback={<p>Loading...</p>}>
							<Delay ms={500} />
						</Suspense>
					</>
				}
			>
				<Delay ms={1000} />
			</Suspense>
		</main>,
	),
);

export default app;
