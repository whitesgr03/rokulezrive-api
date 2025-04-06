# Rokulezrive-API

This project is a token-based authentication and RESTful API design server built with Express. Hosted on Fly.io.

The server hosts the database on Supabase and uses Prisma ORM to build data models and query data and also store files with Cloudinary as storage.

## Links

Frontend Repository: [https://github.com/whitesgr03/rokulezrive](https://github.com/whitesgr03/rokulezrive)

## Technologies:  

1. [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) to verify Supabase JWT token 

2. [Cloudinary](https://cloudinary.com/) to upload file with ArrayBuffer, download file with resource url and manage each files and folders.

3. [Prisma](https://www.prisma.io/docs/orm) to build all data models and perform CRUD operations of file and folder.

## Additional info:

- The API server currently uses the Supabase auth provider to authenticate users. In the future, I planned to create my own authentication system.

## Resource API Endpoints

**Public File**

```
GET /api/public/:publicId

GET /api/public/:publicId/download-url

POST /api/files/:fileId/public

DELETE /api/public/:publicId
```

**Folder**

```
GET /api/folders

POST /api/folders

PATCH /api/folders/:folderId

DELETE /api/folders/:folderId
```

**File**

```
GET /api/files/:fileId/download-url

POST /api/folders/:folderId/files

PATCH /api/files/:fileId

DELETE /api/files/:fileId
```

**File Sharer**

```
GET /api/sharedFiles

POST /api/files/:fileId/sharers

DELETE /api/files/:fileId/sharers/:sharerId',

DELETE /api/sharedFiles/:sharedFileId
```
