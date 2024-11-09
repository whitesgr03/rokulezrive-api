import { v2 } from 'cloudinary';

v2.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinary = v2;

export const uploadFile = (folderId, buffer) =>
	new Promise((resolve, reject) =>
		v2.uploader
			.upload_stream(
				{
					resource_type: 'auto',
					public_id_prefix: folderId,
					type: 'private',
					access_mode: 'public',
					use_filename_as_display_name: false,
				},
				(err, result) => (err ? reject(err) : resolve(result))
			)
			.end(buffer)
	);
