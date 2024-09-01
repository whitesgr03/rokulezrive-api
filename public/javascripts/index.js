"use strict";

const handleClick = e => {
	const dropdown = document.querySelector(".dropdown");

	const handleCloseAccountList = () => {
		dropdown.classList.remove("active");
	};
	const handleDeleteOptionList = () => {
		const optionList = document.querySelector(".optionList");
		optionList?.remove();
	};

	const handleActiveAccountList = () => {
		handleDeleteOptionList();
		dropdown.classList.toggle("active");
		dropdown.classList.add("slide");
	};

	const handleCreateOptionList = e => {
		handleDeleteOptionList();
		handleCloseAccountList();
		const parent = e.target.closest(".fileItem");
		const items = [
			{
				class: "share",
				text: "Share",
			},
			{
				class: "download",
				text: "Download",
			},
			{
				class: "edit",
				text: "Rename",
			},
			{
				class: "delete",
				text: "Remove",
			},
		];

		const list = document.createElement("ul");
		list.classList.add("optionList");

		const createItem = item => {
			const content = `
				<button type="button">
					<span class="icon ${item.class}"><span/>
				</button>
			`;

			const listItem = document.createElement("li");
			listItem.innerHTML = content;
			listItem.querySelector("button").append(item.text);

			return listItem;
		};

		items.forEach(item => list.append(createItem(item)));

		parent.append(list);
	};

	const handleClose = e => {
		!e.target.closest(".account") &&
			!e.target.closest(".dropdown") &&
			handleCloseAccountList();

		!e.target.closest(".optionBtn") &&
			!e.target.closest(".optionList") &&
			handleDeleteOptionList();
	};
	const handleDarkTheme = () => {
		const darkTheme = document.body.classList.toggle("dark");
		localStorage.setItem("darkScheme", JSON.stringify(darkTheme));
	};

	e.target.closest(".account") && handleActiveAccountList();
	e.target.closest(".optionBtn") && handleCreateOptionList(e);
	e.target.closest(".theme") && handleDarkTheme();
	handleClose(e);
};

document.body.addEventListener("click", handleClick);
