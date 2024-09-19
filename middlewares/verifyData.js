import { validationResult, checkSchema, matchedData } from 'express-validator';

export const verifyData = schema => async (req, res, next) => {
	await checkSchema(schema, ['body']).run(req);

	const schemaErrors = validationResult(req);

	const handleSchemaErrors = () => {
		res.status(req.schema?.isConflict ? 409 : 400).json({
			success: false,
			message: schemaErrors.mapped(),
		});
	};

	const setMatchData = () => {
		req.data = matchedData(req);
		next();
	};

	schemaErrors.isEmpty() ? setMatchData() : handleSchemaErrors();
};
