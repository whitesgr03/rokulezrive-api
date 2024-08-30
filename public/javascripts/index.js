"use strict";

const handleClick = e => {
	const dropdown = document.querySelector(".dropdown");

	const handleCloseAccountList = () => {
		dropdown.classList.remove("active");
	};
	const handleActiveAccountList = () => {
		dropdown.classList.toggle("active");
		dropdown.classList.add("slide");
	};
	const handleClose = e => {
		!e.target.closest(".account") &&
			!e.target.closest(".dropdown") &&
			handleCloseAccountList();
	};
	const handleDarkTheme = () => {
		const darkTheme = document.body.classList.toggle("dark");
		localStorage.setItem("darkScheme", JSON.stringify(darkTheme));
	};

	e.target.closest(".account") && handleActiveAccountList();
	e.target.closest(".theme") && handleDarkTheme();
	handleClose(e);
};

document.body.addEventListener("click", handleClick);
