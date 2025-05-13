import { form } from "ovr";

export const CreateUserForm = form((c) => {
	console.log("hello");
	c.redirect("/");
});

export const CreateUser = () => {
	return (
		<CreateUserForm>
			<input type="text" />
			<button>Submit</button>
		</CreateUserForm>
	);
};
