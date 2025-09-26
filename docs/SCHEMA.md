# CoogMusic Schema

_Updated: 09/25/2025_

## Tables

### Album History

```sql
create table album_history
(
    album_id  uuid                                   not null
        constraint fk_album_history_album_id
            references albums
            on update cascade on delete set null,
    user_id   uuid                                   not null
        constraint fk_album_history_user_id
            references users
            on update cascade on delete set null,
    played_at timestamp with time zone default now() not null,
    constraint pk_album_history
        primary key (album_id, user_id, played_at)
);
```

### Album Likes

```sql
create table album_likes
(
    user_id  uuid not null
        constraint fk_album_likes_user_id
            references users
            on update cascade on delete set null,
    album_id uuid not null
        constraint fk_album_likes_album_id
            references albums
            on update cascade on delete set null,
    liked_at timestamp with time zone default now(),
    constraint pk_album_likes
        primary key (user_id, album_id)
);
```

### Album Songs

```sql
create table album_songs
(
    song_id      uuid    not null
        constraint fk_album_songs_song_id
            references songs
            on update cascade on delete set null,
    album_id     uuid    not null
        constraint fk_album_songs_album_id
            references albums
            on update cascade on delete set null,
    track_number integer not null,
    constraint pk_album_songs
        primary key (song_id, album_id)
);
```

### Albums

```sql
create table albums
(
    id           uuid                     default gen_random_uuid() not null
        constraint pk_albums_id
            primary key,
    title        text                                               not null,
    image_url    text,
    created_by   uuid                                               not null
        constraint fk_albums_created_by
            references artists
            on update cascade on delete set null,
    updated_at   timestamp with time zone default now(),
    created_at   timestamp with time zone default now()             not null,
    release_date date                     default now()
);
```

### Artist History

```sql
create table artist_history
(
    artist_id uuid                                   not null
        constraint fk_artist_history_artist_id
            references artists
            on update cascade on delete set null,
    user_id   uuid                                   not null
        constraint fk_artist_history_user_id
            references users
            on update cascade on delete set null,
    played_at timestamp with time zone default now() not null,
    constraint pk_artist_history
        primary key (artist_id, user_id, played_at)
);
```

### Artists

```sql
create table artists
(
    id           uuid                     default gen_random_uuid() not null
        primary key,
    display_name text,
    bio          text,
    user_id      uuid
        constraint fk_artists_user_id
            references users
            on update cascade on delete set null,
    updated_at   timestamp with time zone default now(),
    created_at   timestamp with time zone default now()
);

```

### Comments

```sql
create table comments
(
    id           uuid                     default gen_random_uuid() not null
        primary key,
    comment_text text                                               not null,
    song_id      uuid                                               not null
        constraint fk_comments_song_id
            references songs
            on update cascade on delete set null,
    user_id      uuid                                               not null
        constraint fk_comments_user_id
            references users
            on update cascade on delete set null,
    commented_at timestamp with time zone default now()
);
```

### Playlist History

```sql
create table playlist_history
(
    playlist_id uuid                                   not null
        constraint fk_playlist_history_playlist_id
            references playlists
            on update cascade on delete set null,
    user_id     uuid                                   not null
        constraint fk_playlist_history_user_id
            references users
            on update cascade on delete set null,
    played_at   timestamp with time zone default now() not null,
    constraint pk_playlist_history
        primary key (playlist_id, user_id, played_at)
);
```

### Playlist Likes

```sql
create table playlist_likes
(
    user_id     uuid not null
        constraint fk_playlist_likes_user_id
            references users
            on update cascade on delete set null,
    playlist_id uuid not null
        constraint fk_playlist_likes_playlist_id
            references playlists
            on update cascade on delete set null,
    liked_at    timestamp with time zone default now(),
    constraint pk_playlist_likes
        primary key (user_id, playlist_id)
);
```

### Playlist Songs

```sql
create table playlist_songs
(
    playlist_id uuid not null
        constraint fk_playlist_songs_playlist_id
            references playlists
            on update cascade on delete set null,
    song_id     uuid not null
        constraint fk_playlist_songs_song_id
            references songs
            on update cascade on delete set null,
    added_at    timestamp with time zone default now(),
    constraint pk_playlist_songs
        primary key (playlist_id, song_id)
);
```

### Playlists

```sql
create table playlists
(
    id          uuid                     default gen_random_uuid() not null
        primary key,
    title       text                                               not null,
    description text,
    created_by  uuid                                               not null
        constraint fk_playlists_created_by
            references users
            on update cascade on delete set null,
    updated_at  timestamp with time zone default now(),
    created_at  timestamp with time zone default now()
);
```

### Song Artists

```sql
create table song_artists
(
    song_id   uuid not null
        constraint fk_song_artists_song_id
            references songs
            on update cascade on delete set null,
    artist_id uuid not null
        constraint fk_song_artists_artist_id
            references artists
            on update cascade on delete set null,
    role      text default 'Main'::text,
    constraint pk_song_artists
        primary key (song_id, artist_id)
);
```

### Song History

```sql
create table song_history
(
    song_id   uuid                                   not null
        constraint fk_song_history_song_id
            references songs
            on update cascade on delete set null,
    user_id   uuid                                   not null
        constraint fk_song_history_user_id
            references users
            on update cascade on delete set null,
    played_at timestamp with time zone default now() not null,
    constraint pk_song_history
        primary key (song_id, user_id, played_at)
);
```

### Song Likes

```sql
create table song_likes
(
    user_id  uuid not null
        constraint fk_song_likes_user_id
            references users
            on update cascade on delete set null,
    song_id  uuid not null
        constraint fk_song_likes_song_id
            references songs
            on update cascade on delete set null,
    liked_at timestamp with time zone default now(),
    constraint pk_song_likes
        primary key (user_id, song_id)
);
```

### Songs

```sql
create table songs
(
    id           uuid                     default gen_random_uuid() not null
        constraint pk_songs_id
            primary key,
    title        text                                               not null,
    created_at   timestamp with time zone default now(),
    image_url    text,
    audio_url    text                                               not null,
    genre        text                                               not null,
    duration     smallint                                           not null,
    updated_at   timestamp with time zone default now(),
    release_date date
);
```

### User Followers

```sql
create table user_followers
(
    follower_id  uuid not null
        constraint fk_user_followers_follower_id
            references users
            on update cascade on delete set null,
    following_id uuid not null
        constraint fk_user_followers_following_id
            references artists
            on update cascade on delete set null,
    followed_at  timestamp with time zone default now(),
    constraint pk_user_followers
        primary key (follower_id, following_id)
);
```

### Users

```sql
create table users
(
    id                  uuid                     default gen_random_uuid() not null
        primary key,
    username            varchar(50)                                        not null
        constraint unique_users_username
            unique,
    email               text                                               not null
        constraint unique_users_email
            unique,
    password_hash       text,
    authenticated_with  text                     default 'CoogMusic'::text not null,
    role                user_role                default 'USER'::user_role not null,
    profile_picture_url text,
    updated_at          timestamp with time zone default now(),
    created_at          timestamp with time zone default now(),
    artist_id           uuid
        constraint fk_users_artist_id
            references artists
            on update cascade on delete set null
);
```

## Routines

### Toggle Album Like

```sql
create function toggle_album_like(p_user_id uuid, p_album_id uuid)
    returns TABLE(action text, user_id uuid, album_id uuid, liked_at timestamp with time zone)
    language plpgsql
as
$$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM album_likes
    WHERE album_likes.user_id = p_user_id AND album_likes.album_id = p_album_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count > 0 THEN
        RETURN QUERY SELECT 'unliked'::TEXT, p_user_id, p_album_id, NULL::TIMESTAMPTZ;
    ELSE
        INSERT INTO album_likes (user_id, album_id)
        VALUES (p_user_id, p_album_id);

        RETURN QUERY SELECT 'liked'::TEXT, p_user_id, p_album_id,
                     (SELECT album_likes.liked_at FROM album_likes WHERE album_likes.user_id = p_user_id AND album_likes.album_id = p_album_id);
    END IF;
END;
$$;
```

### Toggle Playlist Like

```sql
create function toggle_playlist_like(p_user_id uuid, p_playlist_id uuid)
    returns TABLE(action text, user_id uuid, playlist_id uuid, liked_at timestamp with time zone)
    language plpgsql
as
$$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM playlist_likes
    WHERE playlist_likes.user_id = p_user_id AND playlist_likes.playlist_id = p_playlist_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count > 0 THEN
        RETURN QUERY SELECT 'unliked'::TEXT, p_user_id, p_playlist_id, NULL::TIMESTAMPTZ;
    ELSE
        INSERT INTO playlist_likes (user_id, playlist_id)
        VALUES (p_user_id, p_playlist_id);

        RETURN QUERY SELECT 'liked'::TEXT, p_user_id, p_playlist_id,
                     (SELECT playlist_likes.liked_at FROM playlist_likes WHERE playlist_likes.user_id = p_user_id AND playlist_likes.playlist_id = p_playlist_id);
    END IF;
END;
$$;
```

### Toggle Song Like

```sql
create function toggle_song_like(p_user_id uuid, p_song_id uuid)
    returns TABLE(action text, user_id uuid, song_id uuid, liked_at timestamp with time zone)
    language plpgsql
as
$$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM song_likes
    WHERE song_likes.user_id = p_user_id AND song_likes.song_id = p_song_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count > 0 THEN
        RETURN QUERY SELECT 'unliked'::TEXT, p_user_id, p_song_id, NULL::TIMESTAMPTZ;
    ELSE
        INSERT INTO song_likes (user_id, song_id)
        VALUES (p_user_id, p_song_id);

        RETURN QUERY SELECT 'liked'::TEXT, p_user_id, p_song_id,
                     (SELECT song_likes.liked_at FROM song_likes WHERE song_likes.user_id = p_user_id AND song_likes.song_id = p_song_id);
    END IF;
END;
$$;
```

### Update Timestamp

```sql
create function update_timestamp() returns trigger
    language plpgsql
as
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
```

## Object Types

### Entity Type

```sql
create type entity_type as enum ('SONG', 'ARTIST', 'ALBUM', 'PLAYLIST');
```

### User Role

```sql
create type user_role as enum ('USER', 'ARTIST', 'ADMIN');
```
