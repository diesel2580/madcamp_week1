
# Photo Table Backend
This project is the backend server for [photo-table-frontend](https://github.com/madcamp-DDDN/photo-table-frontend)

## API Documentation

<details>
<summary><strong>RESTful API</strong></summary>

| Feature | Description | Method | URL | Request Body | Response Body |
| --- | --- | --- | --- | --- | --- |
| Login/Signup | Sign up and login using KakaoTalk | GET | /api/auth/kakao | - (Query params: code, redirect_uri) | Success: { "message": "Auth successful", "user_id": "string" } Failure: { "error": "Failed to authenticate user" } |
| Upload Photo | Upload a photo for a specific time slot | POST | /api/upload | (multipart/form-data) { "user_id": "string", "date": "YYYY-MM-DD", "upload_time_slot": "int", "photo": "string" } | Success: { "message": "Photo uploaded successfully", "photo_data_id": "string", "photo_url": "string" } Failure: { "error": "Failed to upload photo" } |
| Fetch Photos by Date | Retrieve all photos for a specific date | GET | /api/photos | - (Query params: user_id, date) | Success: { "photos": [ { "photo_data_id": "string", "upload_time_slot": "int", "photo_url": "string" } | null ] } Failure: { "error": "Failed to fetch photos" } |
| Fetch Photo by ID | Retrieve photo data by ID | GET | /api/photos/{photo_data_id} | - None | Success: Binary data (photo file) Failure: { "error": "Photo not found" } Server error: { "error": "Failed to fetch photo", "details": "string" } |
| Get User Info | Returns the name and profile image URL for the specified user ID | GET | /api/user | None | Success: { "name": "string", "profile_image_url": "string" } Failure: { "error": "User not found" } Server error: { "error": "Internal Server Error" } |
| Generate Friend Link | Generate a link for sending a friend request | POST | /api/friends/generateFriendLink | { "userId": "string" } | Success: { "token": "string" } Failure: { "error": "Failed to create friend link" } |
| Accept Friend Request | Add each other to friends list via friend request link | POST | /api/friends/acceptFriend | { "token": "string", "userId": "string" } | Success: { "message": "Friend added successfully" } Failure: { "error": "Failed to add friend", "details": "string" } |
| Fetch Friend List | Retrieve the friend list for a specific user | GET | /api/friends/list | - (Query params: user_id) | Success: { "friends": [{ "friend_id": "string", "name": "string", "profile_pic_url": "string" }] } Failure: { "error": "Failed to fetch friends" } |
| Merge Photos by Date | Combine all photos for a specific date into one JPEG file for download | GET | /api/merge-photos | Query params: user_id, date | Success: Merged JPEG file download Failure: { "error": "Failed to merge photos" } |
| Delete Photo | Delete a photo from the database using the given photo_id | DELETE | /api/photos/ | None | Success: { "message": "Photo deleted successfully" } Failure: { "error": "Failed to delete photo" } |

</details>

### API Details

<details>
<summary><strong>1. Login/Signup</strong></summary>

**Description:** Perform login and signup via KakaoTalk. Returns user ID on successful login or signup.

- **Method:** GET
- **Endpoint:** /api/auth/kakao
- **Request Data:**
  - Query Params:
    - code: Kakao authorization code
    - redirect_uri: URI to redirect after login/signup
- **Response Data:**
  - Success: { "message": "Auth successful", "user_id": "string" }
  - Failure: { "error": "Failed to authenticate user" }

</details>

<details>
<summary><strong>2. Upload Photo</strong></summary>

**Description:** Upload a photo for a specific time slot.

- **Method:** POST
- **Endpoint:** /api/upload
- **Request Data:** (multipart/form-data)
  - Body:
    - user_id: User ID (string)
    - date: Upload date (YYYY-MM-DD format)
    - upload_time_slot: Upload time slot (integer, e.g., 0 ~ 2 hours -> 1, 2 ~ 4 hours -> 2, etc.)
    - photo: Photo file (file)
- **Response Data:**
  - Success: { "message": "Photo uploaded successfully", "photo_data_id": "string", "photo_url": "string" }
  - Failure: { "error": "Failed to upload photo" }

</details>

<details>
<summary><strong>3. Fetch Photos by Date</strong></summary>

**Description:** Retrieve all photos for a specific date.

- **Method:** GET
- **Endpoint:** /api/photos
- **Request Data:**
  - Query Params:
    - user_id: User ID (string)
    - date: Date (YYYY-MM-DD format)
- **Response Data:**
  - Success: { "photos": [ { "photo_data_id": "string", "upload_time_slot": "int", "photo_url": "string" } | null ] }
  - Failure: { "error": "Failed to fetch photos" }

</details>

<details>
<summary><strong>4. Fetch Photo by ID</strong></summary>

**Description:** Retrieve photo data by ID.

- **Method:** GET
- **Endpoint:** /api/photos/{photo_data_id}
- **Request Data:** None
- **Response Data:**
  - Success: Binary data (photo file)
  - Failure: { "error": "Photo not found" }
  - Server error: { "error": "Failed to fetch photo", "details": "string" }

</details>

<details>
<summary><strong>5. Get User Info</strong></summary>

**Description:** Returns the name and profile image URL for the specified user ID.

- **Method:** GET
- **Endpoint:** /api/user
- **Request Data:** None
- **Response Data:**
  - Success: { "name": "string", "profile_image_url": "string" }
  - Failure: { "error": "User not found" }
  - Server error: { "error": "Internal Server Error" }

</details>

<details>
<summary><strong>6. Generate Friend Link</strong></summary>

**Description:** Generate a link for sending a friend request.

- **Method:** POST
- **Endpoint:** /api/friends/generateFriendLink
- **Request Data:**
  - Body:
    - userId: User ID (string)
- **Response Data:**
  - Success: { "token": "string" }
  - Failure: { "error": "Failed to create friend link" }

</details>

<details>
<summary><strong>7. Accept Friend Request</strong></summary>

**Description:** Add each other to friends list via friend request link.

- **Method:** POST
- **Endpoint:** /api/friends/acceptFriend
- **Request Data:**
  - Body:
    - token: Token included in the friend request link
    - userId: Requesting user ID (string)
- **Response Data:**
  - Success: { "message": "Friend added successfully" }
  - Failure: { "error": "Failed to add friend", "details": "string" }

</details>

<details>
<summary><strong>8. Fetch Friend List</strong></summary>

**Description:** Retrieve the friend list for a specific user.

- **Method:** GET
- **Endpoint:** /api/friends/list
- **Request Data:**
  - Query Params:
    - user_id: User ID (string)
- **Response Data:**
  - Success: { "friends": [{ "friend_id": "string", "name": "string", "profile_pic_url": "string" }] }
  - Failure: { "error": "Failed to fetch friends" }

</details>

<details>
<summary><strong>9. Merge Photos by Date</strong></summary>

**Description:** Combine all photos for a specific date into one JPEG file for download.

- **Method:** GET
- **Endpoint:** /api/merge-photos
- **Request Data:**
  - Query Params:
    - user_id: User ID
    - date: Date (YYYY-MM-DD format)
- **Response Data:**
  - Success: Merged JPEG file download
  - Failure: { "error": "Failed to merge photos" }

</details>

<details>
<summary><strong>10. Delete Photo</strong></summary>

**Description:** Delete a photo from the database using the given photo_id.

- **Method:** DELETE
- **Endpoint:** /api/photos/
- **Request Data:** None
- **Response Data:**
  - Success: { "message": "Photo deleted successfully" }
  - Failure: { "error": "Failed to delete photo" }

</details>

## Database Structure

<details>
<summary><strong>1. Users Collection (users)</strong></summary>

- _id: ObjectId (Primary Key)
- kakao_id: String (KakaoTalk ID)
- name: String (Name)
- profile_image_url: String (Profile Image URL)
- created_at: Date (Creation Date)
- friend_list_id: ObjectId (Foreign Key, links to friend_list collection)

</details>

<details>
<summary><strong>2. User Day Record Collection (user_day_record)</strong></summary>

- _id: ObjectId (Primary Key)
- user_id: ObjectId (Foreign Key, links to users collection)
- date: Date (Date)
- created_at: Date (Creation Date)

</details>

<details>
<summary><strong>3. Day Photos Collection (day_photos)</strong></summary>

- _id: ObjectId (Primary Key)
- day_record_id: ObjectId (Foreign Key, links to user_day_record collection)
- photo_id: ObjectId (ID of the photo file stored using GridFS)
- upload_time_slot: Number (Upload time slot, e.g., 0 ~ 2 hours -> 1, 2 ~ 4 hours -> 2, etc.)
- created_at: Date (Creation Date)

</details>

<details>
<summary><strong>4. Friend List Collection (friend_list)</strong></summary>

- _id: ObjectId (Primary Key)
- user_id: ObjectId (Foreign Key, links to users collection)
- friends: Array of ObjectId (Array of user IDs of friends)
- created_at: Date (Creation Date)

</details>

### Database Structure Explanation

The above DB structure supports the functionality of recording a day in photos by time slots. Each user can upload photos over multiple time slots on a specific date, and these photos are efficiently managed through the user_day_record and day_photos collections.

1. **Users Collection (users):** This collection stores basic user information. Each user is uniquely identified through their KakaoTalk ID. The user's profile picture is stored as a URL and referenced via the profile_image_url field. Additionally, the friend_list_id field connects to the friend list.

2. **User Day Record Collection (user_day_record):** This collection records data for specific dates for each user. Each record is identified by user ID and date, grouping all photos uploaded by the user on that day.

3. **Day Photos Collection (day_photos):** This collection stores photos uploaded on specific dates. Each photo is identified by the date record ID and the upload time slot (upload_time_slot). The photo file itself is stored in GridFS, referenced via the photo_id field.

4. **Friend List Collection (friend_list):** This collection stores the friend list of users. Each entry consists of the user ID and an array of user IDs of friends, managing user relationships.


## Tech Stack
- Node.js + Express
- MongoDB

## How to use
1. Clone the repo
``` bash
git clone https://github.com/madcamp-DDDN/photo-table-backend.git
```

2. Install dependencies
``` bash
npm install
```

3. Start the dev server
``` bash
npm run dev
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
This project is open source and available under the [MIT License](LICENSE).

  
