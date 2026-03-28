# zonotrack frontend

Frontend for Zonotrack project.

## API URL for mobile

- Mobile devices cannot use `127.0.0.1` to reach your computer backend.
- For real-device testing, set `EXPO_PUBLIC_DEV_API_HOST` to your computer LAN IP (example: `192.168.1.10`).
- API port defaults to `5000`, so with the example above the app will use `http://192.168.1.10:5000`.
- Android emulator fallback uses `http://10.0.2.2:5000`.
- iOS simulator fallback uses `http://localhost:5000`.
