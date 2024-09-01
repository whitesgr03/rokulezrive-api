"use strict";

const darkScheme = localStorage.getItem("darkScheme");

const browserDarkScheme =
	window.matchMedia("(prefers-color-scheme: dark)")?.matches ?? false;

const handleDarkScheme = () => {
	localStorage.setItem("darkScheme", browserDarkScheme);
	browserDarkScheme && document.body.classList.add("dark");
};

darkScheme === null
	? handleDarkScheme()
	: darkScheme === "true" && document.body.classList.add("dark");
