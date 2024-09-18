import { validationResult, checkSchema, matchedData } from 'express-validator';

export const verifyData = schema => async (req, res, next) => {
	await checkSchema(schema, ['body']).run(req);

	const schemaErrors = validationResult(req);

	const handleSchemaErrors = async () => {
		const inputErrors = schemaErrors.mapped();

		res.status(req.schema?.isConflict ? 409 : 400).json({
			success: false,
			inputErrors,
		});
	};

	const setMatchData = () => {
		req.data = matchedData(req);
		next();
	};

	schemaErrors.isEmpty() ? setMatchData() : handleSchemaErrors();
};
