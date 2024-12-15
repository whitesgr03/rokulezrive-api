# Rokulezrive-API

This is an RESTful API server built with Express. Used to receive requests from Rokulezrive.

## Links

Frontend Repository: [https://github.com/whitesgr03/rokulezrive](https://github.com/whitesgr03/rokulezrive)

## Description:

Rokulezrive API build data models and query data with Prisma ORM, uses Supabase PostgreSQL database to store data and also store files with Cloudinary as storage.

## Technologies:  

1. [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) to verify Supabase JWT token 

2. [Cloudinary](https://cloudinary.com/documentation/programmable_media_overview) to upload file with ArrayBuffer, download file with resource url and manage each files and folders.

3. [Prisma](https://www.prisma.io/docs/orm) to build all data models and perform CRUD operations of file and folder.