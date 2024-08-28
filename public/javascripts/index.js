"use strict";

const handleClick = e => {
	const menu = document.querySelector(".menu");
	const features = document.querySelector(".features");

	const handleCloseMenu = () => {
		menu.classList.remove("active");
	};
	const handleCloseAccountList = () => {
		features.classList.remove("active");
	};

	const handleActiveMenu = () => {
		menu.classList.toggle("active");
		handleCloseAccountList();
	};
	const handleActiveAccountList = () => {
		features.classList.toggle("active");
		handleCloseMenu();
	};

	const handleClose = e => {
		!e.target.closest(".menu") &&
			!e.target.closest("nav") &&
			handleCloseMenu();

		!e.target.closest(".features") &&
			!e.target.closest(".dropdown") &&
			handleCloseAccountList();
	};
	const handleDarkTheme = () => {
		const darkTheme = document.body.classList.toggle("dark");
		localStorage.setItem("darkScheme", JSON.stringify(darkTheme));
	};

	e.target.closest(".menu") && handleActiveMenu();
	e.target.closest(".features") && handleActiveAccountList();
	e.target.closest(".theme") && handleDarkTheme();
	handleClose(e);
};

document.body.addEventListener("click", handleClick);
