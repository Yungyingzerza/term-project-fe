# ModernTok API (Expected)

This document outlines expected REST endpoints and payloads inferred from the current frontend implementation and mock data. It is meant as a practical contract for a backend to support this UI.

Sources in code:

- Post and reaction model: `src/interfaces/post.ts:1`
- Feed sample posts: `src/components/Feed.tsx:6`
- Explore grid: `src/components/ExplorePage.tsx:13`
- Profile grid: `src/components/ProfilePage.tsx:17`
- Upload form fields: `src/components/UploadPage.tsx:19`
- Messages/conversations: `src/components/MessagesPage.tsx:14`
- User settings: `src/store/userSlice.ts:1`, `src/components/SettingsPage.tsx:1`

## Conventions

- Base URL: `/api`
- Auth: `Authorization: Bearer <token>` (where applicable)
- IDs: strings (UUIDs)
- Timestamps: ISO 8601 strings (client may render as `2m`, `yesterday` etc.)
- Pagination: cursor-based via `?limit=<n>&cursor=<opaque>`; responses include `nextCursor` when more exist
- Errors: HTTP status codes + JSON `{ "error": { "code": string, "message": string } }`

## Schemas

### User

```
User {
  id: string
  username: string           // display name
  handle: string             // unique handle, e.g. "@lumina.ai"
  pictureUrl: string         // avatar URL
  emails: string[]           // optional additional emails (Settings)
  createdAt: string
  updatedAt: string
}
```

### UserMeta (embedded on posts)

```
UserMeta {
  handle: string
  name: string               // display name
  avatar: string
}
```

### Reaction

```
ReactionKey = "like" | "love" | "haha" | "sad" | "angry"
Interactions = Record<ReactionKey, number>
```

### Post

Derived from `PostItem` used across Feed/Profile:

```
Post {
  id: string
  user: UserMeta
  caption: string
  music: string              // label only (no licensing in demo)
  interactions: Interactions // reaction counts
  comments: number           // count
  saves: number              // count
  thumbnail: string          // URL
  tags: string[]             // e.g. ["#ai", "#setup"]
  videoSrc: string           // URL to HLS/MP4
  visibility: "Public" | "Friends" | "Private" | "Organizations"
  allowComments: boolean
  orgViewIds?: string[]      // when visibility=Organizations
  createdAt: string
  updatedAt: string
  // Optionally include current viewer state:
  viewer?: { saved: boolean, reaction?: ReactionKey }
}
```

### ExploreItem

```
ExploreItem {
  id: string
  title: string
  thumbnail: string
  views: number
  duration: string           // "mm:ss"
  tag?: string               // e.g. "#ai"
}
```

### Conversation

Based on `MessagesPage` local model, normalized for API:

```
Conversation {
  id: string
  participantIds: string[]            // includes current user
  name?: string                       // group name; for 1:1 derive from the peer
  avatar?: string                     // optional group avatar; for 1:1 derive from the peer
  lastMessage?: MessageSummary
  lastMessageAt?: string
  unreadCount: number
  createdAt: string
  updatedAt: string
}

MessageSummary {
  id: string
  senderId: string
  text: string
  createdAt: string
}
```

### Message

```
Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  createdAt: string
  readAt?: string            // present for messages read by current user
}
```

### Organization (used by Upload visibility/target)

```
Organization {
  id: string
  name: string
  logoUrl: string
}
```

---

## Users

- GET `/api/users/me`

  - Returns the authenticated `User`.

- PATCH `/api/users/me`

  - Body: `{ username?: string, pictureUrl?: string, emails?: string[] }`
  - Returns updated `User`.

- POST `/api/users/me/avatar`

  - Content-Type: `multipart/form-data` with field `file` (image)
  - Returns `{ pictureUrl: string }`.

- GET `/api/users/:id`

  - Returns `User` public profile.

- GET `/api/users/:id/posts?limit&cursor`

  - Returns `{ items: Post[], nextCursor?: string }` for profile grid.

- POST `/api/users/me/password`
  - Body: `{ currentPassword: string, newPassword: string }`
  - Returns `204 No Content` on success.

## Feed / Posts

- GET `/api/feed?algo=for-you|following&limit&cursor`

  - Returns `{ items: Post[], nextCursor?: string }`.

- GET `/api/posts/:id`

  - Returns `Post`.

- POST `/api/posts`

  - Content-Type: `multipart/form-data`
  - Fields:
    - `file` (video)
    - `caption` (string)
    - `tags[]` (string, optional, e.g. `#ai`)
    - `visibility` (Public|Friends|Private|Organizations)
    - `allowComments` (boolean)
    - `orgViewIds[]` (string, required when visibility=Organizations)
  - Returns created `Post`.

- PATCH `/api/posts/:id`

  - Body: `{ caption?, tags?, visibility?, allowComments?, orgViewIds? }`
  - Returns updated `Post`.

- DELETE `/api/posts/:id`
  - Returns `204 No Content`.

### Reactions

Matches ActionRail behavior (choose one, change, or remove):

- PUT `/api/posts/:id/reaction`

  - Body: `{ key: ReactionKey }`
  - Returns `{ interactions: Interactions, viewer: { reaction: ReactionKey|null } }`.

- DELETE `/api/posts/:id/reaction`
  - Returns `{ interactions: Interactions, viewer: { reaction: null } }`.

### Saves

- PUT `/api/posts/:id/save`
  - Returns `{ saves: number, viewer: { saved: true } }`.
- DELETE `/api/posts/:id/save`
  - Returns `{ saves: number, viewer: { saved: false } }`.

### Comments (count-only in UI for now)

- GET `/api/posts/:id/comments/count`
  - Returns `{ count: number }`.
- (Optional future) CRUD under `/api/posts/:id/comments`.

## Explore

- GET `/api/explore/trending?limit&cursor`
  - Returns `{ items: ExploreItem[], nextCursor?: string }`.
- GET `/api/explore/search?tag=<#tag|term>&limit&cursor`
  - Returns `{ items: ExploreItem[], nextCursor?: string }`.

## Messages

- GET `/api/conversations?limit&cursor`

  - Returns `{ items: Conversation[], nextCursor?: string }`.

- POST `/api/conversations`

  - Body: `{ participantIds: string[], name?: string }`
  - Returns created `Conversation`.

- GET `/api/conversations/:id`

  - Returns `Conversation`.

- DELETE `/api/conversations/:id`

  - Returns `204 No Content`.

- GET `/api/conversations/:id/messages?limit&cursor`

  - Returns `{ items: Message[], nextCursor?: string }`.

- POST `/api/conversations/:id/messages`

  - Body: `{ text: string }`
  - Returns created `Message` and updated conversation summary:
    - `{ message: Message, conversation: Conversation }`.

- POST `/api/conversations/:id/read`

  - Body: `{ upToMessageId?: string }` (optional; if absent, mark all as read)
  - Returns `{ unreadCount: number }`.

- DELETE `/api/messages/:messageId`
  - Returns `204 No Content`.

## Organizations

- GET `/api/organizations?query=<text>`

  - Returns `{ items: Organization[] }` (used by Upload chooser and Settings hints).

- GET `/api/organizations/suggestions?emailDomain=<domain>`
  - Returns `{ items: Organization[] }` derived from user emails.

## Search (top bar)

- GET `/api/search?q=<term>&limit&cursor`
  - Returns a mixed result set, grouped by type:
  - `{ users: User[], tags: string[], posts: Post[], nextCursor?: string }`.

---

## Examples

### Create Post (multipart)

Request:

```
POST /api/posts
Content-Type: multipart/form-data

file: <video/mp4>
caption: AI lights that sync with your mood ✨
tags[]: #ai
tags[]: #setup
visibility: Public
allowComments: true
```

Response:

```
200 OK
{
  "id": "p_8b2b6e",
  "user": { "handle": "@lumina.ai", "name": "Lumina", "avatar": "https://.../1" },
  "caption": "AI lights that sync with your mood ✨",
  "music": "lofi • midnight drive",
  "interactions": { "like": 0, "love": 0, "haha": 0, "sad": 0, "angry": 0 },
  "comments": 0,
  "saves": 0,
  "thumbnail": "https://cdn.example.com/thumbs/p_8b2b6e.jpg",
  "tags": ["#ai", "#setup"],
  "videoSrc": "https://cdn.example.com/videos/p_8b2b6e.mp4",
  "visibility": "Public",
  "allowComments": true,
  "createdAt": "2025-01-15T12:00:00.000Z",
  "updatedAt": "2025-01-15T12:00:00.000Z",
  "viewer": { "saved": false }
}
```

### React to Post

```
PUT /api/posts/p1/reaction
{
  "key": "love"
}

=> 200 OK
{
  "interactions": { "like": 9800, "love": 1801, "haha": 400, "sad": 150, "angry": 150 },
  "viewer": { "reaction": "love" }
}
```

### Save/Unsave Post

```
PUT /api/posts/p1/save
=> { "saves": 941, "viewer": { "saved": true } }
DELETE /api/posts/p1/save
=> { "saves": 940, "viewer": { "saved": false } }
```

### Conversations and Messages

List conversations:

```
GET /api/conversations
=> {
  "items": [
    {
      "id": "c1",
      "participantIds": ["me","u_ava"],
      "lastMessage": { "id": "m1", "senderId": "u_ava", "text": "That cut was so clean!", "createdAt": "2025-01-15T09:41:00Z" },
      "lastMessageAt": "2025-01-15T09:41:00Z",
      "unreadCount": 2,
      "createdAt": "2025-01-14T08:00:00Z",
      "updatedAt": "2025-01-15T09:41:00Z"
    }
  ]
}
```

Fetch messages:

```
GET /api/conversations/c1/messages?limit=50
=> {
  "items": [
    { "id": "m1", "conversationId": "c1", "senderId": "u_ava", "text": "That cut was so clean!", "createdAt": "2025-01-15T09:41:00Z" },
    { "id": "m2", "conversationId": "c1", "senderId": "me", "text": "Thanks! Tried a new grade.", "createdAt": "2025-01-15T09:42:00Z", "readAt": "2025-01-15T09:45:00Z" }
  ]
}
```

Send a message:

```
POST /api/conversations/c1/messages
{ "text": "New message" }
=> { "message": { ... }, "conversation": { ... } }
```

Mark as read:

```
POST /api/conversations/c1/read
{ "upToMessageId": "m2" }
=> { "unreadCount": 0 }
```

### Users (Settings)

Update profile:

```
PATCH /api/users/me
{ "username": "Lumina", "emails": ["me@company.com"] }
=> 200 OK { ...User }
```

Upload avatar:

```
POST /api/users/me/avatar
Content-Type: multipart/form-data
file: <image/png>
=> 200 OK { "pictureUrl": "https://cdn.example.com/avatars/u_123.png" }
```

### Organizations

Search organizations:

```
GET /api/organizations?query=ver
=> { "items": [ { "id": "o_vercel", "name": "Vercel", "logoUrl": "https://logo.clearbit.com/vercel.com" } ] }
```

---

## Notes

- Reaction keys and interaction counts mirror the UI picker: `like|love|haha|sad|angry`.
- `ExploreItem` is a lightweight listing shape used on Explore and Profile grids; detail views should resolve to full `Post` by `id`.
- Message times shown in the UI like `"2m"` or `"yesterday"` are presentation-only; the API should return ISO timestamps.
- Upload visibility and organization scoping are taken from the Upload page; backends should enforce access accordingly when `visibility="Organizations"`.
