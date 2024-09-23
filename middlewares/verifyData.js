import { validationResult, checkSchema, matchedData } from 'express-validator';

export const verifyData = schema => async (req, res, next) => {
	await checkSchema(schema, ['body']).run(req);

	const schemaErrors = validationResult(req);

	const handleSchemaErrors = () => {
		const errors = schemaErrors.mapped();

		let fields = {};

		for (const key of Object.keys(errors)) {
			fields[key] = errors[key]['msg'];
		}

		res.status(req.schema?.isConflict ? 409 : 400).json({
			success: false,
			fields,
		});
	};

	const setMatchData = () => {
		req.data = matchedData(req);
		next();
	};

	schemaErrors.isEmpty() ? setMatchData() : handleSchemaErrors();
};
