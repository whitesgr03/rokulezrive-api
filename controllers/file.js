import asyncHandler from "express-async-handler";
const fileCreateGet = asyncHandler((req, res) => {
	res.render("file_form");
});
const fileList = asyncHandler((req, res) =>
	res.render("drive", { files: true }),
);
const sharedList = asyncHandler((req, res) =>
	res.render("drive", { shared: true }),
);
const index = asyncHandler((req, res) =>
	res.render("drive", {
		files: true,
		shared: true,
	}),
);

export {
	fileCreateGet,
	fileList,
	sharedList,
	index,
};
