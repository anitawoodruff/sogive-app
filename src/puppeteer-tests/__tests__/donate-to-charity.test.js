const puppeteer = require("puppeteer");
const { doLogin, donate } = require("../test-base/UtilityFunctions");
const { username, password } = require("../Credentials");
const { CommonSelectors, Search, General } = require('../SoGiveSelectors');
const { targetServers } = require('../testConfig');

const Details = {
	name: "Human Realman",
	email: "mark@winterwell.com",
	address: "123 Clown Shoes Avenue",
	postcode: "CS20AD",
	"consent-checkbox": true
};

const config = JSON.parse(process.env.__CONFIGURATION);

const baseSite = targetServers[config.site];
const protocol = config.site === 'local' ? 'http://' : 'https://';

let url = `${baseSite}`;

// This test depends on Oxfam already being in the charity database.
const charityName = "oxfam";

describe("Charity donation tests", () => {

	beforeEach(async () => {
		await page.goto(url);
	});

	test("Logged-out charity donation", async () => {
		// Search for charity
		await page.click(Search.Main.SearchField);
		await page.keyboard.type(charityName);
		await page.click(Search.Main.SearchButton);

		// Click on first link in search results
		await page.waitForSelector(Search.Main.FirstResult);
		await page.click(Search.Main.FirstResult);

		await donate({
			page,
			Amount: {
				amount: 1
			},
			GiftAid: {},
			Details
		});
	}, 90000);

	test("Logged-in charity donation", async () => {
		// login
		await page.click('.login-link');
		await page.click('[name=email]');
		await page.type('[name=email]', username);
		await page.click('[name=password]');
		await page.type('[name=password]', password);
		await page.keyboard.press('Enter');
		// wait for login dialog to disappear
		await page.waitForSelector('[name=email]', { hidden: true });

		// Search for charity
		await page.click(Search.Main.SearchField);
		await page.keyboard.type(charityName);
		await page.click(Search.Main.SearchButton);

		// Click on first link in search results
		await page.waitForSelector(Search.Main.FirstResult);
		await page.click(Search.Main.FirstResult);

		await donate({
			page,
			Amount: {
				amount: 1
			},
			GiftAid: {},
			Details
		});
	}, 90000);
});
