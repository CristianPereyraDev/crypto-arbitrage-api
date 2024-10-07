import { type Express } from "express";
import mongooseConnect from "../../databases/mongodb/mongodb.js";
import { Server } from "http";

const appSetup = async (app: Express): Promise<Server | undefined> => {
	try {
		// Set database connection
		await mongooseConnect();

		const APP_PORT =
			process.env.PORT !== undefined ? Number(process.env.PORT) : 3000;

		const server = app.listen(APP_PORT, () => {
			console.log(`Server started on port ${APP_PORT}`);
		});

		server.setTimeout(5000, () => {
			console.log("An socket's timeout");
		});

		return server;
	} catch (error) {
		console.log("Unable to start the app!");
		console.log(error);
		return undefined;
	}
};

export default appSetup;
