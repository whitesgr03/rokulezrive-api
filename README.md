# Rokulezrive-API

This project is a token-based authentication and RESTful API design server built with Express. Hosted on Fly.io.

The server hosts the database on Supabase and uses Prisma ORM to build data models and query data and also store files with Cloudinary as storage.

## Links

Frontend Repository: [https://github.com/whitesgr03/rokulezrive](https://github.com/whitesgr03/rokulezrive)

## Technologies:  

1. [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) to verify Supabase JWT token 

2. [Cloudinary](https://cloudinary.com/) to upload file with ArrayBuffer, download file with resource url and manage each files and folders.

3. [Prisma](https://www.prisma.io/docs/orm) to build all data models and perform CRUD operations of file and folder.