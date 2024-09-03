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

	const handleActiveOptionList = e => {
		handleCloseAccountList();

		const optionBtn = e.target.closest(".optionBtn");
		const optionList = optionBtn.querySelector(".optionList");

		const handleCreateList = () => {
			handleCloseCurrentActiveOptionList();
			const parent =
				(e.target.closest(".shared") && "shared") ||
				(e.target.closest(".file") && "file");

			const options = {
				shared: [
					{
						class: "link",
						text: "Copy link",
					},
					{
						class: "download",
						text: "Download",
					},
					{
						class: "delete",
						text: "Remove",
					},
				],
				file: [
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
				],
			};

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

			options[parent].forEach(item => list.append(createItem(item)));

			optionBtn.append(list);
			optionBtn.classList.add("active");
		};

		const handleActive = () => {
			activeOptionBtn !== optionBtn &&
				activeOptionBtn?.classList.remove("active");
			optionBtn.classList.toggle("active");
		};

		optionList ? handleActive() : handleCreateList();
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
