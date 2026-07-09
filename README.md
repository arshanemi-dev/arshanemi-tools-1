# arshanemi-tools-1
This is based on next js ecommerce related all tools

## Storage providers

Files are stored company-wise and user-wise (`/tools/<company.folderId>/<user_folder_name>`) on one of
two interchangeable backends, both implementing the same interface in `lib/storage/`:

- **Dropbox** (`lib/storage/dropbox.js`) — OAuth refresh-token flow, see the `DROPBOX_*` vars in `.env.example`.
- **Bunny.net** (`lib/storage/bunny.js`) — Edge Storage HTTP API (`AccessKey` header, no SDK), see the
  `BUNNY_*` vars in `.env.example`. Public file URLs require a Pull Zone attached to the storage zone
  (`BUNNY_PULL_ZONE_URL`). Bunny has no native rename/move/copy, so those are emulated via download + re-upload.

The active provider is a single, global switch — set it in **Settings → Storage**, or from the storage
badge in the header. Switching doesn't move existing files between providers; it only changes where new
folders and uploads go. Company/user root folders are created automatically the first time they're needed
under whichever provider is active (or in bulk via the "Provision all folders now" button in Settings).
