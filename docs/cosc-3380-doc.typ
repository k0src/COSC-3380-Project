#set text(
  font: "Noto Sans",
  size: 10.5pt,
)

#set page(
  columns: 2, 
  paper: "us-letter",
  margin: (x: 0.5in, y: 0.5in),
)

#set heading(numbering: "1.")

#let mono_font = "NotoMono NFP"

#show raw: set text(font: mono_font, size: 10pt)

= CoogMusic
#v(0.5em)

CoogMusic is an online music library, where users (primarily UH students and alumni) can upload tracks and listen to tracks by other artists. Users can choose to browse and listen to music without an account, however users must be registered (as artists) to post songs. The application has a community aspect as well — users can follow artists, “like” uploads, comment on uploads, and create playlists of songs.

== Data Model

=== Users

The `User` entity represents an authenticated CoogMusic user. Each user has role-based permissions and may optionally be associated with an artist profile.

*Attributes*:

#rect(
  fill: blue.lighten(80%),
  stroke: 0.5pt,
  radius: 2pt,
  inset: 6pt,
  width: 100%,
  [
    #set text(font: mono_font, size: 10pt)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 2em,
      [
        - #underline[id]
        - username
        - email
        - password_hash
        - authenticated_with
      ],
      [
        - role
        - pfp_image_url
        - artist_id
        - created_at
        - updated_at
      ]
    )
  ]
)

=== Artists

The `Artist` entity represents a musical artist within the platform. Each artist is associated with a user account.

*Attributes*:

#rect(
  fill: blue.lighten(80%),
  stroke: 0.5pt,
  radius: 2pt,
  inset: 6pt,
  width: 100%,
  [
    #set text(font: mono_font, size: 10pt)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 2em,
      [
        - #underline[id]
        - display_name
        - bio
      ],
      [
        - user_id
        - created_at
        - updated_at
      ]
    )
  ]
)

=== Songs

The `Song` entity represents individual music tracks uploaded by artists.

*Attributes*:

#rect(
  fill: blue.lighten(80%),
  stroke: 0.5pt,
  radius: 2pt,
  inset: 6pt,
  width: 100%,
  [
    #set text(font: mono_font, size: 10pt)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 2em,
      [
        - #underline[id]
        - title
        - album_id
        - genre
        - duration
      ],
      [
        - audio_url
        - image_url
        - created_at
        - updated_at
      ]
    )
  ]
)

=== Albums

The `Album` entity represents collections of songs created by artists.

*Attributes*:

#rect(
  fill: blue.lighten(80%),
  stroke: 0.5pt,
  radius: 2pt,
  inset: 6pt,
  width: 100%,
  [
    #set text(font: mono_font, size: 10pt)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 2em,
      [
        - #underline[id]
        - title
        - image_url
      ],
      [
        - created_by
        - created_at
        - updated_at
      ]
    )
  ]
)

=== Playlists

The `Playlist` entity represents user-created collections of songs.

*Attributes*:

#rect(
  fill: blue.lighten(80%),
  stroke: 0.5pt,
  radius: 2pt,
  inset: 6pt,
  width: 100%,
  [
    #set text(font: mono_font, size: 10pt)
    #grid(
      columns: (1fr, 1fr),
      column-gutter: 2em,
      [
        - #underline[id]
        - title
        - description
      ],
      [
        - created_by
        - created_at
        - updated_at
      ]
    )
  ]
)

== Entity Relationships

- Users can like songs, albums, and playlists
- Users have listening history and can follow artists  
- Songs are performed by artists (many-to-many)
- Playlists contain songs and belong to users
- Users can comment on songs

#grid(
  columns: (1fr, 1fr),
  column-gutter: 1em,
  [
    *Song Likes*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          user_id \
          song_id \
          liked_at
        ]
      ]
    )
  ],
  [
    *Album Likes*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          user_id \
          album_id \
          liked_at
        ]
      ]
    )
  ]
)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 1em,
  [
    *Playlist Likes*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          user_id \
          playlist_id \
          liked_at
        ]
      ]
    )
  ],
  [
    *User History*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          user_id \
          song_id \
          played_at
        ]
      ]
    )
  ]
)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 1em,
  [
    *User Followers*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          follower_id  \
          following_id \
          followed_at
        ]
      ]
    )
  ],
  [
    *Song Artists*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          song_id \
          artist_id \
          role
        ]
      ]
    )
  ]
)

#grid(
  columns: (1fr, 1fr),
  column-gutter: 1em,
  [
    *Playlist Songs*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          playlist_id  \
          song_id \
          added_at
        ]
      ]
    )
  ],
  [
    *Song Comments*
    #v(-0.2em)
    #rect(
      fill: gray.lighten(80%),
      stroke: 0.5pt,
      radius: 2pt,
      inset: 6pt,
      width: 100%,
      [
        #set text(font: mono_font, size: 10pt)
        #align(left)[
          user_id \
          song_id \
          comment_text 
        ]
      ]
    )
  ]
)

== User Authentication & Roles

User roles define the levels of access and permissions of different types of users within CoogMusic. Each role builds upon the previous, which creates a hierarchy that ranges from casual browsing to full administrative control.

=== Roles

+ *Unauthenticated User* - Can browse the site, view songs, artist profiles, and playlists. These users have limited access and cannot interact with the site beyond causal browsing.
+ *User* - Basic authenticated user. Can browse the site, like songs, comment on songs, follow artists, create playlists, and save tracks and playlists to their library.
+ *Artist* - Authenticated user that has registered as an artist. Has all the privileges of the basic authenticated user, but can also upload songs, update and delete their own songs, and upload and create albums.
+ *Admin* - Admins moderate content and manage user behavior. Has all the privileges of an authenticated user, but can update and delete songs, albums, and playlists, as well as update and ban users.

=== Authentication System

The CoogMusic authentication system implements server authentication with site-based sign-up and Google OAuth authentication, allowing users to sign up with their Google account.

+ *Primary Authentication* - Email/password with `bcrypt` hashing.
+ *OAuth Integration* - OAuth allows users to sign up or log in using third-party authentication providers, including Google OAuth.
+ *Security* - JWT refresh and access tokens provide stateless authentication, allowing sessions to be maintained securely. CSRF protection prevents cross-site request forgery attacks. 

== Data Entry Forms

Data entry forms provide a method for users and artists generate content for the platform.

+ *Song Upload*
  - Song metadata (title, genre, album)
  - Audio file upload with format validation
  - Cover art image upload

+ *Album Creation*
  - Album information (title, description, release date)
  - Cover art upload
  - Song selection

+ *Playlist Management*
  - Playlist metadata (title, description)
  - Song addition/removal interface
  - Playlist sharing options

+ *User Profiles*
  - Profile information (bio, profile picture)
  - Account settings and preferences

+ *Admin Management*
  - Content moderation tools
  - User management interface
  - System configuration options

== Data Queries

Data queries are used to retrieve and serve relevant content to users, and to provide statistics and analytics to artists and admins.

+ *General Site Queries*
  - Song page (song, artist, album, comments, related songs)
  - Album page (songs, artist, related albums)
  - Playlist page (profile information, followers/following, uploaded songs)

+ *Statistics/Insights*
  - Site-wide statistics page
  - Artist's 10 ten most played/liked songs
  - User's most streamed songs

== Data Reports

Data reports consolidate information to create periodic and real-time analytics.

+ *Monthly Site Analytics*
  - Total new user registrations
  - Song upload statistics by genre
  - Most active users and artists

+ *Realtime Analytics*
  - Trending songs and albums
  - Artist growth metrics (followers, plays)
  - Genre popularity statistics

== Triggers

Database triggers are used to automate routine data operations.

+ *Update Timestamp*
  - Automatically update `updated_at` when a record in `Songs`, `Albums`, or `Playlists` is modified.

+ *History Cleanup*
  - Automatically delete rows from `user_history` older than 30 days whenever the table is updated.

#set page(
  columns: 1, 
)

== Schema Diagram

#v(0.5em)

#figure(
  image("coog-music-schema.png", width: 100%),
)